;; Analytics Protocol Contract
;; Records and manages analysis methodologies

(define-constant ERR_UNAUTHORIZED (err u300))
(define-constant ERR_ANALYSIS_EXISTS (err u301))
(define-constant ERR_ANALYSIS_NOT_FOUND (err u302))
(define-constant ERR_INVALID_PARAMETERS (err u303))

;; Analysis methodology structure
(define-map analyses
  { analysis-id: uint }
  {
    researcher: principal,
    cohort-id: uint,
    methodology: (string-ascii 200),
    parameters: (string-ascii 300),
    statistical-methods: (list 5 (string-ascii 50)),
    expected-duration: uint,
    created-at: uint,
    status: (string-ascii 20),
    results-hash: (optional (buff 32))
  }
)

(define-data-var next-analysis-id uint u1)

;; Register a new analysis protocol
(define-public (register-analysis
  (cohort-id uint)
  (methodology (string-ascii 200))
  (parameters (string-ascii 300))
  (statistical-methods (list 5 (string-ascii 50)))
  (expected-duration uint))
  (let ((analysis-id (var-get next-analysis-id)))
    (asserts! (> expected-duration u0) ERR_INVALID_PARAMETERS)
    (map-set analyses
      { analysis-id: analysis-id }
      {
        researcher: tx-sender,
        cohort-id: cohort-id,
        methodology: methodology,
        parameters: parameters,
        statistical-methods: statistical-methods,
        expected-duration: expected-duration,
        created-at: block-height,
        status: "registered",
        results-hash: none
      }
    )
    (var-set next-analysis-id (+ analysis-id u1))
    (ok analysis-id)
  )
)

;; Start analysis execution
(define-public (start-analysis (analysis-id uint))
  (match (map-get? analyses { analysis-id: analysis-id })
    analysis (begin
      (asserts! (is-eq tx-sender (get researcher analysis)) ERR_UNAUTHORIZED)
      (asserts! (is-eq (get status analysis) "registered") ERR_INVALID_PARAMETERS)
      (map-set analyses
        { analysis-id: analysis-id }
        (merge analysis { status: "running" })
      )
      (ok true)
    )
    ERR_ANALYSIS_NOT_FOUND
  )
)

;; Complete analysis with results
(define-public (complete-analysis (analysis-id uint) (results-hash (buff 32)))
  (match (map-get? analyses { analysis-id: analysis-id })
    analysis (begin
      (asserts! (is-eq tx-sender (get researcher analysis)) ERR_UNAUTHORIZED)
      (asserts! (is-eq (get status analysis) "running") ERR_INVALID_PARAMETERS)
      (map-set analyses
        { analysis-id: analysis-id }
        (merge analysis {
          status: "completed",
          results-hash: (some results-hash)
        })
      )
      (ok true)
    )
    ERR_ANALYSIS_NOT_FOUND
  )
)

;; Get analysis details
(define-read-only (get-analysis (analysis-id uint))
  (map-get? analyses { analysis-id: analysis-id })
)
