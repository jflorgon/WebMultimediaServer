# Reglas mínimas. Release sin minify por defecto; activar isMinifyEnabled cuando se libere.
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations

# kotlinx.serialization
-keep,includedescriptorclasses class com.jose.mediaserver.**$$serializer { *; }
-keepclassmembers class com.jose.mediaserver.** {
    *** Companion;
}
-keepclasseswithmembers class com.jose.mediaserver.** {
    kotlinx.serialization.KSerializer serializer(...);
}
