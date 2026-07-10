# ==============================================================================
# R8 / ProGuard Compiler Fixes (Build Crash & Failure Protection)
# ==============================================================================
-dontoptimize
-dontobfuscate
-ignorewarnings

# ==============================================================================
# React Native 0.85+ Core & Internals
# ==============================================================================
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod, SourceFile, LineNumberTable

-dontwarn com.facebook.react.**
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }

-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }

# ==============================================================================
# App Specific (com.chauffer)
# ==============================================================================
-keep class com.chauffer.** { *; }
-keepclassmembers class com.chauffer.** { *; }

# ==============================================================================
# Google Play Services, Firebase & Maps Fixes
# ==============================================================================
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google Maps & Location Specific
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.android.gms.location.** { *; }
-keep class com.google.android.gms.internal.location.** { *; }

# ==============================================================================
# Third-Party Libraries (From package.json)
# ==============================================================================

# 1. Notifee (Notification Crash Fix)
-keep class io.invertase.notifee.** { *; }
-dontwarn io.invertase.notifee.**

# 2. Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# 3. React Native Screens (Navigation Crash Fix)
-keep class com.swmansion.rnscreens.** { *; }
-dontwarn com.swmansion.rnscreens.**

# 4. React Native SVG
-keep class com.horcrux.svg.** { *; }

# 5. Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# 6. WebView
-keep class com.reactnativecommunity.webview.** { *; }

# 7. HTML to PDF / PDFBox Rules
-dontwarn com.tom_roush.pdfbox.**
-dontwarn com.gemalto.jp2.**
-keep class com.tom_roush.pdfbox.** { *; }

# 8. OkHttp / Axios (Network call optimizations)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# 9. Additional React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# 10. React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# 11. React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# 12. React Native Image Picker
-keep class com.reactnativecommunity.imagepicker.** { *; }

# 13. Date and Time Picker
-keep class com.reactcommunity.rndatetimepicker.** { *; }

# 14. React Native Sound / Audio
-keep class com.zmxv.RNSound.** { *; }
# React Native Maps Rules
-keep class com.airbnb.android.react.maps.** { *; }
-dontwarn com.airbnb.android.react.maps.**