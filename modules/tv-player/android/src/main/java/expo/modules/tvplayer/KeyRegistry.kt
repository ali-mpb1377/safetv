package expo.modules.tvplayer

import java.lang.ref.WeakReference

/**
 * Lets MainActivity hand the remote's channel keys (CH+ / CH-, and Page Up /
 * Page Down on remotes that send those instead) to the player that is open.
 *
 * React Native does not deliver these keys on every TV, so MainActivity
 * catches them before anything else and this registry forwards them to the
 * player view, which sends an `onChannelKey` event to JavaScript.
 */
object KeyRegistry {
    @Volatile
    private var listener: WeakReference<TvPlayerView>? = null

    fun setListener(view: TvPlayerView) {
        listener = WeakReference(view)
    }

    fun clearListener(view: TvPlayerView) {
        if (listener?.get() === view) listener = null
    }

    /** True while a player view is on screen (then the keys are ours). */
    fun isActive(): Boolean = listener?.get()?.isAttachedToWindow == true

    fun dispatchChannelKey(up: Boolean) {
        listener?.get()?.dispatchChannelKey(up)
    }
}
