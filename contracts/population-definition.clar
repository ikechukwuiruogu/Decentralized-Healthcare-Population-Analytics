;; Population Definition Contract
;; Defines and manages analysis cohorts

(define-constant ERR_UNAUTHORIZED (err u200))
(define-constant ERR_COHORT_EXISTS (err u201))
(define-constant ERR_COHORT_NOT_FOUND (err u202))
(define-constant ERR_INVALID_CRITERIA (err u203))

;; Cohort definition structure
(define-map cohorts
  { cohort-id: uint }
  {
    creator: principal,
    name: (string-ascii 100),
    description: (string-ascii 500),
    age-range: { min: uint, max: uint },
    conditions: (list 10 (string-ascii 50)),
    geographic-region: (string-ascii 100),
    sample-size: uint,
    created-at: uint,
    status: (string-ascii 20)
  }
)

(define-data-var next-cohort-id uint u1)

;; Create a new population cohort
(define-public (create-cohort
  (name (string-ascii 100))
  (description (string-ascii 500))
  (age-min uint)
  (age-max uint)
  (conditions (list 10 (string-ascii 50)))
  (geographic-region (string-ascii 100))
  (sample-size uint))
  (let ((cohort-id (var-get next-cohort-id)))
    (asserts! (> sample-size u0) ERR_INVALID_CRITERIA)
    (asserts! (<= age-min age-max) ERR_INVALID_CRITERIA)
    (map-set cohorts
      { cohort-id: cohort-id }
      {
        creator: tx-sender,
        name: name,
        description: description,
        age-range: { min: age-min, max: age-max },
        conditions: conditions,
        geographic-region: geographic-region,
        sample-size: sample-size,
        created-at: block-height,
        status: "active"
      }
    )
    (var-set next-cohort-id (+ cohort-id u1))
    (ok cohort-id)
  )
)

;; Get cohort details
(define-read-only (get-cohort (cohort-id uint))
  (map-get? cohorts { cohort-id: cohort-id })
)

;; Update cohort status
(define-public (update-cohort-status (cohort-id uint) (new-status (string-ascii 20)))
  (match (map-get? cohorts { cohort-id: cohort-id })
    cohort (begin
      (asserts! (is-eq tx-sender (get creator cohort)) ERR_UNAUTHORIZED)
      (map-set cohorts
        { cohort-id: cohort-id }
        (merge cohort { status: new-status })
      )
      (ok true)
    )
    ERR_COHORT_NOT_FOUND
  )
)

;; Get active cohorts count
(define-read-only (get-cohorts-count)
  (var-get next-cohort-id)
)
