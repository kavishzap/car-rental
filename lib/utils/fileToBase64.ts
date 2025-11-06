export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string) // this is a data URL (e.g., "data:image/png;base64,...")
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
