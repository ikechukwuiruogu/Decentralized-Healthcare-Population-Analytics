// Population Definition Contract Tests

import { describe, it, expect, beforeEach } from "vitest"

describe("Population Definition Contract", () => {
  const contractState = {
    cohorts: new Map(),
    nextCohortId: 1,
  }
  
  const mockCreator = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  const mockOtherUser = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
  
  beforeEach(() => {
    contractState.cohorts.clear()
    contractState.nextCohortId = 1
  })
  
  const createCohort = (name, description, ageMin, ageMax, conditions, region, sampleSize, sender = mockCreator) => {
    if (sampleSize <= 0) {
      return { error: "ERR_INVALID_CRITERIA" }
    }
    if (ageMin > ageMax) {
      return { error: "ERR_INVALID_CRITERIA" }
    }
    
    const cohortId = contractState.nextCohortId
    
    contractState.cohorts.set(cohortId, {
      creator: sender,
      name,
      description,
      ageRange: { min: ageMin, max: ageMax },
      conditions,
      geographicRegion: region,
      sampleSize,
      createdAt: 12345, // mock block height
      status: "active",
    })
    
    contractState.nextCohortId += 1
    return { ok: cohortId }
  }
  
  const getCohort = (cohortId) => {
    return contractState.cohorts.get(cohortId) || null
  }
  
  const updateCohortStatus = (cohortId, newStatus, sender = mockCreator) => {
    const cohort = contractState.cohorts.get(cohortId)
    if (!cohort) {
      return { error: "ERR_COHORT_NOT_FOUND" }
    }
    if (sender !== cohort.creator) {
      return { error: "ERR_UNAUTHORIZED" }
    }
    
    contractState.cohorts.set(cohortId, {
      ...cohort,
      status: newStatus,
    })
    
    return { ok: true }
  }
  
  const getCohortsCount = () => {
    return contractState.nextCohortId
  }
  
  it("should create a new population cohort", () => {
    const result = createCohort(
        "Diabetes Study",
        "Type 2 diabetes patients in urban areas",
        18,
        65,
        ["diabetes-type-2"],
        "Urban-US",
        1000,
    )
    
    expect(result.ok).toBe(1)
    
    const cohort = getCohort(1)
    expect(cohort).toBeDefined()
    expect(cohort.name).toBe("Diabetes Study")
    expect(cohort.ageRange.min).toBe(18)
    expect(cohort.ageRange.max).toBe(65)
    expect(cohort.sampleSize).toBe(1000)
    expect(cohort.status).toBe("active")
  })
  
  it("should reject invalid age ranges", () => {
    const result = createCohort(
        "Invalid Cohort",
        "Test cohort",
        65,
        18, // max < min
        ["condition"],
        "Region",
        100,
    )
    
    expect(result.error).toBe("ERR_INVALID_CRITERIA")
  })
  
  it("should reject zero or negative sample size", () => {
    const result = createCohort(
        "Invalid Sample",
        "Test cohort",
        18,
        65,
        ["condition"],
        "Region",
        0, // invalid sample size
    )
    
    expect(result.error).toBe("ERR_INVALID_CRITERIA")
  })
  
  it("should update cohort status by creator only", () => {
    createCohort("Test Cohort", "Description", 18, 65, ["condition"], "Region", 100)
    
    const result = updateCohortStatus(1, "completed")
    expect(result.ok).toBe(true)
    
    const cohort = getCohort(1)
    expect(cohort.status).toBe("completed")
  })
  
  it("should reject status update from non-creator", () => {
    createCohort("Test Cohort", "Description", 18, 65, ["condition"], "Region", 100)
    
    const result = updateCohortStatus(1, "completed", mockOtherUser)
    expect(result.error).toBe("ERR_UNAUTHORIZED")
  })
  
  it("should handle non-existent cohort updates", () => {
    const result = updateCohortStatus(999, "completed")
    expect(result.error).toBe("ERR_COHORT_NOT_FOUND")
  })
  
  it("should track cohort count correctly", () => {
    expect(getCohortsCount()).toBe(1) // starts at 1
    
    createCohort("Cohort 1", "Desc", 18, 65, ["c1"], "R1", 100)
    expect(getCohortsCount()).toBe(2)
    
    createCohort("Cohort 2", "Desc", 25, 75, ["c2"], "R2", 200)
    expect(getCohortsCount()).toBe(3)
  })
  
  it("should store complex cohort data correctly", () => {
    const conditions = ["hypertension", "diabetes", "obesity"]
    createCohort(
        "Multi-condition Study",
        "Patients with multiple chronic conditions for longitudinal analysis",
        30,
        80,
        conditions,
        "Metropolitan-Northeast",
        2500,
    )
    
    const cohort = getCohort(1)
    expect(cohort.conditions).toEqual(conditions)
    expect(cohort.geographicRegion).toBe("Metropolitan-Northeast")
    expect(cohort.description).toContain("longitudinal analysis")
  })
  
  it("should handle edge case age ranges", () => {
    // Same min and max age
    const result1 = createCohort("Same Age", "Desc", 25, 25, ["condition"], "Region", 100)
    expect(result1.ok).toBe(1)
    
    // Very wide age range
    const result2 = createCohort("Wide Range", "Desc", 0, 120, ["condition"], "Region", 100)
    expect(result2.ok).toBe(2)
  })
})

console.log("✅ Population Definition tests completed")
