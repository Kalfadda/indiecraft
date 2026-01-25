; Scythe Ops BYOD - NSIS Installer Hooks
; The setup wizard in the app handles Supabase configuration

!macro NSIS_HOOK_PREINSTALL
  ; Pre-installation tasks
  ; Nothing needed here - setup wizard handles config
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ; Create app data directory if it doesn't exist
  CreateDirectory "$LOCALAPPDATA\com.scythe.assettracker"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; Pre-uninstall tasks
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; Clean up app data directory on uninstall
  RMDir /r "$LOCALAPPDATA\com.scythe.assettracker"
!macroend
