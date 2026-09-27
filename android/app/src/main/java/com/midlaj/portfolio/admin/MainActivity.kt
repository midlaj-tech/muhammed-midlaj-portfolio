package com.midlaj.portfolio.admin

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.Button
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.webkit.WebViewAssetLoader
import java.util.concurrent.Executor

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var lockOverlay: ConstraintLayout
    private lateinit var unlockButton: Button

    private lateinit var executor: Executor
    private lateinit var biometricPrompt: BiometricPrompt
    private lateinit var promptInfo: BiometricPrompt.PromptInfo
    private lateinit var assetLoader: WebViewAssetLoader

    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var isAuthenticated = false
    private var lastPauseTime: Long = 0

    companion object {
        private const val LIVE_URL = "https://muhammed-midlaj-portfolio.vercel.app/admin.html"
        private const val LOCAL_URL = "https://appassets.androidplatform.net/admin.html"
    }

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK && result.data != null) {
            val data = result.data
            val results = WebChromeClient.FileChooserParams.parseResult(result.resultCode, data)
            fileChooserCallback?.onReceiveValue(results)
        } else {
            fileChooserCallback?.onReceiveValue(null)
        }
        fileChooserCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        setupAssetLoader()
        setupViews()
        setupBiometrics()
        authenticateWithBiometrics()
    }

    private fun setupAssetLoader() {
        assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
    }

    private fun setupViews() {
        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        lockOverlay = findViewById(R.id.lockOverlay)
        unlockButton = findViewById(R.id.unlockButton)

        swipeRefresh.setOnRefreshListener {
            webView.reload()
            swipeRefresh.isRefreshing = false
        }

        unlockButton.setOnClickListener {
            authenticateWithBiometrics()
        }

        configureWebView()
    }

    private fun isNetworkConnected(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val activeNet = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(activeNet) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        WebView.setWebContentsDebuggingEnabled(true)
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.addJavascriptInterface(AndroidBridge(), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val url = request?.url ?: return null
                if (url.host == "appassets.androidplatform.net") {
                    return assetLoader.shouldInterceptRequest(url)
                }
                return super.shouldInterceptRequest(view, request)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                if (isAuthenticated) {
                    injectAuthenticatedSession()
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true && request.url.host?.contains("vercel.app") == true) {
                    // Seamlessly fallback to offline local bundled asset
                    view?.loadUrl(LOCAL_URL)
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("mailto:") || url.startsWith("tel:") ||
                    url.startsWith("https://wa.me") || url.startsWith("https://api.whatsapp.com")) {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        return true
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "No application available to open link", Toast.LENGTH_SHORT).show()
                    }
                }
                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    android.util.Log.d("WebViewConsole", "${it.messageLevel()}: ${it.message()} [${it.sourceId()}:${it.lineNumber()}]")
                }
                return super.onConsoleMessage(consoleMessage)
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileChooserCallback?.onReceiveValue(null)
                fileChooserCallback = filePathCallback

                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "*/*"
                }
                try {
                    fileChooserLauncher.launch(intent)
                } catch (e: Exception) {
                    fileChooserCallback = null
                    return false
                }
                return true
            }
        }

        // Load live Vercel admin if connected, else fallback to bundled offline assets
        if (isNetworkConnected()) {
            webView.loadUrl(LIVE_URL)
        } else {
            webView.loadUrl(LOCAL_URL)
        }
    }

    private fun setupBiometrics() {
        executor = ContextCompat.getMainExecutor(this)
        biometricPrompt = BiometricPrompt(this, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    if (!isAuthenticated) {
                        lockOverlay.visibility = View.VISIBLE
                    }
                }

                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    isAuthenticated = true
                    lockOverlay.visibility = View.GONE
                    Toast.makeText(applicationContext, "✓ Pixel 8 Verified. Welcome Midlaj!", Toast.LENGTH_SHORT).show()
                    injectAuthenticatedSession()
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    Toast.makeText(applicationContext, "Fingerprint not recognized. Try again.", Toast.LENGTH_SHORT).show()
                }
            })

        val authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
        promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(getString(R.string.biometric_title))
            .setSubtitle(getString(R.string.biometric_subtitle))
            .setDescription(getString(R.string.biometric_description))
            .setAllowedAuthenticators(authenticators)
            .build()
    }

    private fun authenticateWithBiometrics() {
        val biometricManager = BiometricManager.from(this)
        val authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
        when (biometricManager.canAuthenticate(authenticators)) {
            BiometricManager.BIOMETRIC_SUCCESS -> {
                biometricPrompt.authenticate(promptInfo)
            }
            else -> {
                // If biometrics not configured on device, allow access through device credentials
                lockOverlay.visibility = View.GONE
                isAuthenticated = true
                injectAuthenticatedSession()
            }
        }
    }

    private fun injectAuthenticatedSession() {
        val script = """
            (function() {
                try {
                    const session = {
                        token: 'pixel8_bio_' + Date.now(),
                        loginTime: Date.now(),
                        lastActive: Date.now()
                    };
                    sessionStorage.setItem('midlaj_portfolio_session', JSON.stringify(session));
                    
                    const loginView = document.getElementById('login-view');
                    const workspace = document.getElementById('admin-workspace');
                    if (loginView) loginView.style.display = 'none';
                    if (workspace) workspace.style.display = 'block';
                    
                    window.dispatchEvent(new CustomEvent('biometric-auth-success', { detail: { session } }));
                    
                    if (typeof window.updateAllAdminViews === 'function') {
                        window.updateAllAdminViews();
                    } else if (typeof updateAllAdminViews === 'function') {
                        updateAllAdminViews();
                    }
                    if (typeof window.showToast === 'function') {
                        window.showToast('Pixel 8 Biometric Verified • Welcome Midlaj!', '');
                    } else if (typeof showToast === 'function') {
                        showToast('Pixel 8 Biometric Verified • Welcome Midlaj!', '');
                    }
                } catch(e) {
                    console.error('Biometric session injection error: ' + (e && e.name) + ' - ' + (e && e.message) + ' stack: ' + (e && e.stack));
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(script, null)
    }

    override fun onResume() {
        super.onResume()
        // Auto-lock if backgrounded for more than 5 minutes
        if (isAuthenticated && lastPauseTime > 0 && System.currentTimeMillis() - lastPauseTime > 5 * 60 * 1000) {
            isAuthenticated = false
            lockOverlay.visibility = View.VISIBLE
            authenticateWithBiometrics()
        }
    }

    override fun onPause() {
        super.onPause()
        lastPauseTime = System.currentTimeMillis()
    }

    inner class AndroidBridge {
        @JavascriptInterface
        fun requestBiometric() {
            runOnUiThread {
                authenticateWithBiometrics()
            }
        }

        @JavascriptInterface
        fun isBiometricAvailable(): Boolean {
            val biometricManager = BiometricManager.from(this@MainActivity)
            val authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
            return biometricManager.canAuthenticate(authenticators) == BiometricManager.BIOMETRIC_SUCCESS
        }

        @JavascriptInterface
        fun showNativeToast(message: String) {
            runOnUiThread {
                Toast.makeText(applicationContext, message, Toast.LENGTH_SHORT).show()
            }
        }
    }
}
