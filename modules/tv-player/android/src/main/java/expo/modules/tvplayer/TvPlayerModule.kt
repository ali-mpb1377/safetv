package expo.modules.tvplayer

import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import okhttp3.ConnectionSpec
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

@UnstableApi
class TvPlayerModule : Module() {

    private val fetchClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    // Older devices (e.g. Android 7) and old IPTV servers sometimes only agree on
    // legacy TLS settings. Used as a second attempt after an SSL failure.
    private val compatFetchClient: OkHttpClient by lazy {
        fetchClient.newBuilder()
            .connectionSpecs(
                listOf(
                    ConnectionSpec.MODERN_TLS,
                    ConnectionSpec.COMPATIBLE_TLS,
                    ConnectionSpec.CLEARTEXT
                )
            )
            .build()
    }

    private fun fetchOnce(client: OkHttpClient, url: String): Map<String, Any> {
        val request = Request.Builder()
            .url(url)
            .addHeader("User-Agent", BROWSER_UA)
            .addHeader("Accept", "*/*")
            .build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                return mapOf(
                    "success" to false,
                    "error" to "HTTP ${response.code}",
                    "content" to ""
                )
            }
            val content = response.body?.string() ?: ""
            return mapOf("success" to true, "error" to "", "content" to content)
        }
    }

    private fun fetchError(e: Throwable): Map<String, Any> = mapOf(
        "success" to false,
        // Keep the exception type: it tells "no internet" from "certificate" etc.
        "error" to "${e.javaClass.simpleName}: ${e.message ?: "unknown"}",
        "content" to ""
    )

    private val BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

    override fun definition() = ModuleDefinition {
        Name("TvPlayer")

        // ── Native playlist fetcher — uses OkHttp with browser User-Agent
        //   because React Native's fetch strips/overrides the User-Agent header.
        AsyncFunction("fetchPlaylist") { url: String ->
            try {
                fetchOnce(fetchClient, url)
            } catch (e: javax.net.ssl.SSLException) {
                try {
                    fetchOnce(compatFetchClient, url)
                } catch (e2: Throwable) {
                    fetchError(e2)
                }
            } catch (e: Throwable) {
                fetchError(e)
            }
        }

        // ── View ────────────────────────────────────────────────────────────
        View(TvPlayerView::class) {

            // ── Events (JS callbacks via EventDispatcher) ──────────────────
            Events(
                "onReady",
                "onError",
                "onPlayingChange",
                "onBufferingChange",
                "onBackgroundAudioChange",
                "onPositionChange",
                "onTracksChange",
                "onPipModeChange",
                "onEngineChange",
            )

            // ── Commands (imperative API, auto-added to React ref) ─────────

            AsyncFunction("loadSource") { view: TvPlayerView, params: Map<String, Any?> ->
                val url                = params["url"] as? String ?: return@AsyncFunction
                val headers            = (params["headers"] as? Map<*, *>)
                                             ?.mapNotNull { (k, v) ->
                                                 if (k is String && v is String) k to v else null
                                             }?.toMap() ?: emptyMap()
                val drmType            = params["drmType"] as? String
                val drmLicenseUrl      = params["drmLicenseUrl"] as? String
                val drmLicenseKey      = params["drmLicenseKey"] as? String
                val drmHeaders         = (params["drmHeaders"] as? Map<*, *>)
                                             ?.mapNotNull { (k, v) ->
                                                 if (k is String && v is String) k to v else null
                                             }?.toMap()
                val drmPssh            = params["drmPssh"] as? String
                val autoPlay           = params["autoPlay"] as? Boolean ?: true

                view.load(url, headers, drmType, drmLicenseUrl, drmLicenseKey, drmHeaders, drmPssh, autoPlay)
            }

            AsyncFunction("play") { view: TvPlayerView ->
                view.play()
            }

            AsyncFunction("pause") { view: TvPlayerView ->
                view.pause()
            }

            AsyncFunction("seekTo") { view: TvPlayerView, positionMs: Double ->
                view.seekTo(positionMs.toLong())
            }

            AsyncFunction("setVolume") { view: TvPlayerView, volume: Double ->
                view.setVolume(volume.toFloat())
            }

            AsyncFunction("release") { view: TvPlayerView ->
                view.releasePlayer()
            }

            AsyncFunction("getCurrentPosition") { view: TvPlayerView ->
                view.getCurrentPosition()
            }

            AsyncFunction("getDuration") { view: TvPlayerView ->
                view.getDuration()
            }

            AsyncFunction("isPlaying") { view: TvPlayerView ->
                view.isPlaying()
            }

            // ── Background audio ───────────────────────────────────────────

            // "contain" → RESIZE_MODE_FIT (0)
            // "cover"   → RESIZE_MODE_ZOOM (3)
            // "fill"    → RESIZE_MODE_FILL (1)
            AsyncFunction("setResizeMode") { view: TvPlayerView, mode: String ->
                val resizeMode = when (mode) {
                    "cover"   -> androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                    "fill"    -> androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FILL
                    else      -> androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT
                }
                view.setResizeMode(resizeMode)
            }

            AsyncFunction("enableBackgroundAudio") { view: TvPlayerView ->
                view.enableBackgroundAudio()
            }

            AsyncFunction("disableBackgroundAudio") { view: TvPlayerView ->
                view.disableBackgroundAudio()
            }

            AsyncFunction("isBackgroundAudioEnabled") { view: TvPlayerView ->
                view.isBackgroundAudioEnabled()
            }

            // ── Foreground MediaSession (system controls without background opt-in) ──

            AsyncFunction("ensureMediaSession") { view: TvPlayerView ->
                view.ensureForegroundSession()
            }

            AsyncFunction("releaseMediaSession") { view: TvPlayerView ->
                view.releaseForegroundSession()
            }

            // ── Track selection ────────────────────────────────────────────

            AsyncFunction("selectAudioTrack") { view: TvPlayerView, groupIndex: Int, trackIndex: Int ->
                view.selectAudioTrack(groupIndex, trackIndex)
            }

            AsyncFunction("selectSubtitleTrack") { view: TvPlayerView, groupIndex: Int, trackIndex: Int ->
                view.selectSubtitleTrack(groupIndex, trackIndex)
            }

            AsyncFunction("isPiPSupported") { view: TvPlayerView ->
                view.isPiPSupported()
            }

            AsyncFunction("enterPip") { view: TvPlayerView ->
                view.enterPip()
            }

            AsyncFunction("setMediaMetadata") { view: TvPlayerView, params: Map<String, Any?> ->
                val title      = params["title"] as? String ?: ""
                val artist     = params["artist"] as? String ?: "Prysm"
                val artworkUri = params["artworkUri"] as? String
                view.setMediaMetadata(title, artist, artworkUri)
            }

            // ── Player engine switching ──────────────────────────────────────

            AsyncFunction("setPlayerEngine") { view: TvPlayerView, engine: String ->
                view.setPlayerEngine(engine)
            }

            AsyncFunction("getPlayerEngine") { view: TvPlayerView ->
                view.getPlayerEngine()
            }
        }
    }
}
