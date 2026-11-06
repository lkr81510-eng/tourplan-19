import './StatusMessage.css'

function ErrorMessage({ message = '정보를 불러오지 못했습니다.', onRetry }) {
  return (
    <div className="status-message status-message--error" role="alert">
      <span className="status-message__icon" aria-hidden="true">⚠️</span>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="status-message__button" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
