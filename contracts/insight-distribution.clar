;; Insight Distribution Contract
;; Manages sharing of population health findings

(define-constant ERR_UNAUTHORIZED (err u500))
(define-constant ERR_INSIGHT_NOT_FOUND (err u501))
(define-constant ERR_ACCESS_DENIED (err u502))
(define-constant ERR_INVALID_INSIGHT (err u503))

;; Insight structure
(define-map insights
  { insight-id: uint }
  {
    researcher: principal,
    analysis-id: uint,
    title: (string-ascii 200),
    summary: (string-ascii 500),
    findings: (string-ascii 1000),
    confidence-level: uint,
    peer-reviewed: bool,
    public-access: bool,
    created-at: uint,
    access-count: uint
  }
)

;; Access permissions
(define-map access-permissions
  { insight-id: uint, accessor: principal }
  { granted-at: uint, expires-at: uint }
)

(define-data-var next-insight-id uint u1)

;; Publish research insight
(define-public (publish-insight
  (analysis-id uint)
  (title (string-ascii 200))
  (summary (string-ascii 500))
  (findings (string-ascii 1000))
  (confidence-level uint)
  (public-access bool))
  (let ((insight-id (var-get next-insight-id)))
    (asserts! (<= confidence-level u100) ERR_INVALID_INSIGHT)
    (asserts! (>= confidence-level u1) ERR_INVALID_INSIGHT)
    (map-set insights
      { insight-id: insight-id }
      {
        researcher: tx-sender,
        analysis-id: analysis-id,
        title: title,
        summary: summary,
        findings: findings,
        confidence-level: confidence-level,
        peer-reviewed: false,
        public-access: public-access,
        created-at: block-height,
        access-count: u0
      }
    )
    (var-set next-insight-id (+ insight-id u1))
    (ok insight-id)
  )
)

;; Grant access to specific insight
(define-public (grant-access (insight-id uint) (accessor principal) (duration uint))
  (match (map-get? insights { insight-id: insight-id })
    insight (begin
      (asserts! (is-eq tx-sender (get researcher insight)) ERR_UNAUTHORIZED)
      (map-set access-permissions
        { insight-id: insight-id, accessor: accessor }
        { granted-at: block-height, expires-at: (+ block-height duration) }
      )
      (ok true)
    )
    ERR_INSIGHT_NOT_FOUND
  )
)

;; Access insight (with permission check)
(define-public (access-insight (insight-id uint))
  (match (map-get? insights { insight-id: insight-id })
    insight (begin
      (asserts!
        (or
          (get public-access insight)
          (is-eq tx-sender (get researcher insight))
          (is-some (map-get? access-permissions { insight-id: insight-id, accessor: tx-sender }))
        )
        ERR_ACCESS_DENIED
      )
      (map-set insights
        { insight-id: insight-id }
        (merge insight { access-count: (+ (get access-count insight) u1) })
      )
      (ok insight)
    )
    ERR_INSIGHT_NOT_FOUND
  )
)

;; Mark insight as peer-reviewed
(define-public (mark-peer-reviewed (insight-id uint))
  (match (map-get? insights { insight-id: insight-id })
    insight (begin
      (asserts! (is-eq tx-sender (get researcher insight)) ERR_UNAUTHORIZED)
      (map-set insights
        { insight-id: insight-id }
        (merge insight { peer-reviewed: true })
      )
      (ok true)
    )
    ERR_INSIGHT_NOT_FOUND
  )
)

;; Get public insights
(define-read-only (get-insight (insight-id uint))
  (map-get? insights { insight-id: insight-id })
)
