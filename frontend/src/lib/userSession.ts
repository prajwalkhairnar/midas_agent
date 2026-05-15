export function getUserSessionId(): string {
  let id = localStorage.getItem('user_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('user_session_id', id)
  }
  return id
}
