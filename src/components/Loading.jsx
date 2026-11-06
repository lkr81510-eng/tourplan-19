import './StatusMessage.css'

function Loading({ message = '여행 정보를 불러오는 중이에요…' }) {
  return (
    <div className="status-message" role="status" aria-live="polite">
      <div className="status-message__spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}

export default Loading
