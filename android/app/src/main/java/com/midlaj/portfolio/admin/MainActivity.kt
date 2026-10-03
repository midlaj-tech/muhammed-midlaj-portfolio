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
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
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
    private lateinit var usePasswordButton: Button

    private lateinit var executor: Executor
    private lateinit var biometricPrompt: BiometricPrompt
    private lateinit var promptInfo: BiometricPrompt.PromptInfo
    private lateinit var assetLoader: WebViewAssetLoader

    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var isAuthenticated = false
    private var lastPauseTime: Long = 0

    companion object {
        private const val LIVE_URL = "https://www.midlaj.online/admin.html"
        private const val LOCAL_URL = "https://appassets.androidplatform.net/admin.html"
        private const val PREFS_NAME = "midlaj_portfolio_prefs"
        private const val KEY_BIOMETRIC_OPT_IN_SHOWN = "biometric_opt_in_shown"
        private const val KEY_BIOMETRIC_ENABLED = "biometric_enabled"
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
        setupBackNavigation()

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isBiometricEnabled = prefs.getBoolean(KEY_BIOMETRIC_ENABLED, false)

        isAuthenticated = false
        if (isBiometricEnabled) {
            lockOverlay.visibility = View.VISIBLE
            authenticateWithBiometrics()
        } else {
            lockOverlay.visibility = View.GONE
        }
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
        usePasswordButton = findViewById(R.id.usePasswordButton)

        swipeRefresh.setOnRefreshListener {
            if (isNetworkConnected()) {
                webView.clearCache(true)
                webView.loadUrl("$LIVE_URL?v=${System.currentTimeMillis()}")
            } else {
                webView.reload()
            }
            swipeRefresh.isRefreshing = false
        }

        unlockButton.setOnClickListener {
            authenticateWithBiometrics()
        }

        usePasswordButton.setOnClickListener {
            isAuthenticated = false
            lockOverlay.visibility = View.GONE
            clearWebSession()
        }

        configureWebView()
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val isBiometricEnabled = prefs.getBoolean(KEY_BIOMETRIC_ENABLED, false)

                // 1. If currently on lock overlay, back press exits the application safely
                if (lockOverlay.visibility == View.VISIBLE) {
                    finish()
                    return
                }

                // 2. If NOT authenticated (e.g. user clicked "Log in with Password" and is on login screen)
                if (!isAuthenticated) {
                    if (isBiometricEnabled) {
                        // Return user back to the Biometric Lock Overlay
                        clearWebSession()
                        lockOverlay.visibility = View.VISIBLE
                        authenticateWithBiometrics()
                    } else {
                        // Biometrics not enabled: exit the app
                        finish()
                    }
                    return
                }

                // 3. If authenticated in admin workspace:
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })
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
        settings.cacheMode = if (isNetworkConnected()) WebSettings.LOAD_NO_CACHE else WebSettings.LOAD_DEFAULT
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
                } else {
                    clearWebSession()
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true && (request.url.host?.contains("midlaj.online") == true || request.url.host?.contains("vercel.app") == true)) {
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
            webView.clearCache(true)
            webView.loadUrl("$LIVE_URL?v=${System.currentTimeMillis()}")
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
                    isAuthenticated = false
                    val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    if (prefs.getBoolean(KEY_BIOMETRIC_ENABLED, false)) {
                        lockOverlay.visibility = View.VISIBLE
                    } else {
                        lockOverlay.visibility = View.GONE
                        clearWebSession()
                    }
                }

                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    isAuthenticated = true
                    lockOverlay.visibility = View.GONE
                    Toast.makeText(applicationContext, "✓ Biometrics Verified", Toast.LENGTH_SHORT).show()
                    injectAuthenticatedSession()
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    isAuthenticated = false
                    Toast.makeText(applicationContext, "Biometrics not recognized", Toast.LENGTH_SHORT).show()
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
                // If biometrics not configured or supported, force master password authentication
                isAuthenticated = false
                lockOverlay.visibility = View.GONE
                clearWebSession()
            }
        }
    }

    private fun clearWebSession() {
        val script = """
            (function() {
                try {
                    sessionStorage.removeItem('midlaj_portfolio_session');
                    const loginView = document.getElementById('login-view');
                    const workspace = document.getElementById('admin-workspace');
                    if (loginView) loginView.style.display = 'flex';
                    if (workspace) workspace.style.display = 'none';
                    const pwdInput = document.getElementById('login-password');
                    if (pwdInput) pwdInput.value = '';
                } catch(e) {}
            })();
        """.trimIndent()
        webView.evaluateJavascript(script, null)
    }

    private fun injectAuthenticatedSession() {
        val script = """
            (function() {
                try {
                    const session = {
                        token: 'admin_bio_' + Date.now(),
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
                        window.showToast('Biometrics Verified', '✓');
                    } else if (typeof showToast === 'function') {
                        showToast('Biometrics Verified', '✓');
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
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isBiometricEnabled = prefs.getBoolean(KEY_BIOMETRIC_ENABLED, false)

        if (isAuthenticated && lastPauseTime > 0 && System.currentTimeMillis() - lastPauseTime > 5 * 60 * 1000) {
            isAuthenticated = false
            clearWebSession()
            if (isBiometricEnabled) {
                lockOverlay.visibility = View.VISIBLE
                authenticateWithBiometrics()
            }
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
        fun onWebLoginSuccess() {
            runOnUiThread {
                isAuthenticated = true
                val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val optInShown = prefs.getBoolean(KEY_BIOMETRIC_OPT_IN_SHOWN, false)
                if (!optInShown && isBiometricAvailable()) {
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle(R.string.biometric_opt_in_title)
                        .setMessage(R.string.biometric_opt_in_message)
                        .setPositiveButton(R.string.enable_biometrics) { _, _ ->
                            prefs.edit()
                                .putBoolean(KEY_BIOMETRIC_OPT_IN_SHOWN, true)
                                .putBoolean(KEY_BIOMETRIC_ENABLED, true)
                                .apply()
                            Toast.makeText(this@MainActivity, "Biometric login enabled", Toast.LENGTH_SHORT).show()
                        }
                        .setNegativeButton(R.string.use_password_only) { _, _ ->
                            prefs.edit()
                                .putBoolean(KEY_BIOMETRIC_OPT_IN_SHOWN, true)
                                .putBoolean(KEY_BIOMETRIC_ENABLED, false)
                                .apply()
                            Toast.makeText(this@MainActivity, "Password login active", Toast.LENGTH_SHORT).show()
                        }
                        .setCancelable(false)
                        .show()
                }
            }
        }

        @JavascriptInterface
        fun onWebLogout() {
            runOnUiThread {
                isAuthenticated = false
                clearWebSession()
                val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                if (prefs.getBoolean(KEY_BIOMETRIC_ENABLED, false)) {
                    lockOverlay.visibility = View.VISIBLE
                }
            }
        }

        @JavascriptInterface
        fun showNativeToast(message: String) {
            runOnUiThread {
                Toast.makeText(applicationContext, message, Toast.LENGTH_SHORT).show()
            }
        }
    }
}
