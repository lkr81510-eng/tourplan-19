import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <p>
        출처:{' '}
        <a href="https://api.visitkorea.or.kr" target="_blank" rel="noopener noreferrer">
          한국관광공사 TourAPI
        </a>
      </p>
      <p>© {new Date().getFullYear()} 오늘의 여행 플래너</p>
    </footer>
  )
}

export default Footer
