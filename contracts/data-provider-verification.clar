;; Data Provider Verification Contract
;; Validates and manages healthcare data sources

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_PROVIDER_EXISTS (err u101))
(define-constant ERR_PROVIDER_NOT_FOUND (err u102))
(define-constant ERR_INVALID_STATUS (err u103))

;; Data provider structure
(define-map data-providers
  { provider-id: uint }
  {
    address: principal,
    name: (string-ascii 100),
    certification: (string-ascii 50),
    status: (string-ascii 20),
    verified-at: uint,
    data-types: (list 10 (string-ascii 50))
  }
)

(define-data-var next-provider-id uint u1)

;; Register a new data provider
(define-public (register-provider
  (name (string-ascii 100))
  (certification (string-ascii 50))
  (data-types (list 10 (string-ascii 50))))
  (let ((provider-id (var-get next-provider-id)))
    (asserts! (is-none (map-get? data-providers { provider-id: provider-id })) ERR_PROVIDER_EXISTS)
    (map-set data-providers
      { provider-id: provider-id }
      {
        address: tx-sender,
        name: name,
        certification: certification,
        status: "pending",
        verified-at: u0,
        data-types: data-types
      }
    )
    (var-set next-provider-id (+ provider-id u1))
    (ok provider-id)
  )
)

;; Verify a data provider (admin only)
(define-public (verify-provider (provider-id uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (match (map-get? data-providers { provider-id: provider-id })
      provider (begin
        (map-set data-providers
          { provider-id: provider-id }
          (merge provider { status: "verified", verified-at: block-height })
        )
        (ok true)
      )
      ERR_PROVIDER_NOT_FOUND
    )
  )
)

;; Get provider details
(define-read-only (get-provider (provider-id uint))
  (map-get? data-providers { provider-id: provider-id })
)

;; Check if provider is verified
(define-read-only (is-provider-verified (provider-id uint))
  (match (map-get? data-providers { provider-id: provider-id })
    provider (is-eq (get status provider) "verified")
    false
  )
)
