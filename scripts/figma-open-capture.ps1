# Abre URLs locales con parámetros de captura Figma — uso interno
param(
  [Parameter(Mandatory)][string]$CaptureId,
  [Parameter(Mandatory)][string]$Path,
  [int]$Delay = 4000
)
$base = 'http://localhost:5500'
$ep = [uri]::EscapeDataString("https://mcp.figma.com/mcp/capture/$CaptureId/submit")
$url = "$base$Path#figmacapture=$CaptureId&figmaendpoint=$ep&figmadelay=$Delay"
Start-Process $url
