package expo.modules.securetoken

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Small encrypted key/value store for secrets such as the account token.
 *
 * Values are encrypted with AES-256-GCM using a key that lives in the Android
 * Keystore (the key material never leaves secure hardware / the Keystore), and
 * the ciphertext is kept in a private SharedPreferences file.
 */
class SecureTokenModule : Module() {
  companion object {
    private const val KEY_ALIAS = "safetv_secure_token_key"
    private const val PREFS = "safetv_secure_prefs"
    private const val KEYSTORE = "AndroidKeyStore"
    private const val TRANSFORMATION = "AES/GCM/NoPadding"
  }

  override fun definition() = ModuleDefinition {
    Name("SecureToken")

    AsyncFunction("setItem") { key: String, value: String ->
      val prefs = prefs()
      prefs.edit().putString(key, encrypt(value)).apply()
      true
    }

    AsyncFunction("getItem") { key: String ->
      val stored = prefs().getString(key, null)
      if (stored == null) {
        null
      } else {
        try {
          decrypt(stored)
        } catch (e: Exception) {
          // Key was lost / data corrupted: treat as "not stored".
          prefs().edit().remove(key).apply()
          null
        }
      }
    }

    AsyncFunction("removeItem") { key: String ->
      prefs().edit().remove(key).apply()
      true
    }
  }

  private fun prefs() = (appContext.reactContext
    ?: throw IllegalStateException("React context not available"))
    .applicationContext
    .getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  private fun secretKey(): SecretKey {
    val ks = KeyStore.getInstance(KEYSTORE).apply { load(null) }
    (ks.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }

    val generator = KeyGenerator.getInstance(
      KeyProperties.KEY_ALGORITHM_AES,
      KEYSTORE,
    )
    generator.init(
      KeyGenParameterSpec.Builder(
        KEY_ALIAS,
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
      )
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setKeySize(256)
        .build(),
    )
    return generator.generateKey()
  }

  private fun encrypt(plain: String): String {
    val cipher = Cipher.getInstance(TRANSFORMATION)
    cipher.init(Cipher.ENCRYPT_MODE, secretKey())
    val iv = cipher.iv
    val data = cipher.doFinal(plain.toByteArray(Charsets.UTF_8))
    return Base64.encodeToString(iv, Base64.NO_WRAP) + ":" +
      Base64.encodeToString(data, Base64.NO_WRAP)
  }

  private fun decrypt(stored: String): String {
    val parts = stored.split(":")
    require(parts.size == 2) { "bad format" }
    val iv = Base64.decode(parts[0], Base64.NO_WRAP)
    val data = Base64.decode(parts[1], Base64.NO_WRAP)
    val cipher = Cipher.getInstance(TRANSFORMATION)
    cipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(128, iv))
    return String(cipher.doFinal(data), Charsets.UTF_8)
  }
}
