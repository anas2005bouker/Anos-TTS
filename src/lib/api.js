export async function callFunction(name, payload = {}, token) {
  const res = await fetch(`/api/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Function ${name} failed`)
  return data
}

export function downloadBase64Audio(base64, filename, contentType = 'audio/wav') {
  const a = document.createElement('a')
  a.href = `data:${contentType};base64,${base64}`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
