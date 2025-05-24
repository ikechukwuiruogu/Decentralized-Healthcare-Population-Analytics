// Analytics Protocol Contract Tests

import { describe, it, expect, beforeEach } from "vitest"

describe("Analytics Protocol Contract", () => {
  const contractState = {
    analyses: new Map(),
    nextAnalysisId: 1,
  }
  
  const mockResearcher = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  const mockOtherUser = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
  
  beforeEach(() => {
    contractState.analyses.clear()
    contractState.nextAnalysisId = 1
  })
  
  const registerAnalysis = (cohortId, methodology, parameters, methods, duration, sender = mockResearcher) => {
    if (duration <= 0) {
      return { error: "ERR_INVALID_PARAMETERS" }
    }
    
    const analysisId = contractState.nextAnalysisId
    
    contractState.analyses.set(analysisId, {
      researcher: sender,
      cohortId,
      methodology,
      parameters,
      statisticalMethods: methods,
      expectedDuration: duration,
      createdAt: 12345,
      status: "registered",
      resultsHash: null,
    })
    
    contractState.nextAnalysisId += 1
    return { ok: analysisId }
  }
  
  const startAnalysis = (analysisId, sender = mockResearcher) => {
    const analysis = contractState.analyses.get(analysisId)
    if (!analysis) {
      return { error: "ERR_ANALYSIS_NOT_FOUND" }
    }
    if (sender !== analysis.researcher) {
      return { error: "ERR_UNAUTHORIZED" }
    }
    if (analysis.status !== "registered") {
      return { error: "ERR_INVALID_PARAMETERS" }
    }
    
    contractState.analyses.set(analysisId, {
      ...analysis,
      status: "running",
    })
    
    return { ok: true }
  }
  
  const completeAnalysis = (analysisId, resultsHash, sender = mockResearcher) => {
    const analysis = contractState.analyses.get(analysisId)
    if (!analysis) {
      return { error: "ERR_ANALYSIS_NOT_FOUND" }
    }
    if (sender !== analysis.researcher) {
      return { error: "ERR_UNAUTHORIZED" }
    }
    if (analysis.status !== "running") {
      return { error: "ERR_INVALID_PARAMETERS" }
    }
    
    contractState.analyses.set(analysisId, {
      ...analysis,
      status: "completed",
      resultsHash,
    })
    
    return { ok: true }
  }
  
  const getAnalysis = (analysisId) => {
    return contractState.analyses.get(analysisId) || null
  }
  
  it("should register a new analysis protocol", () => {
    const result = registerAnalysis(
        1,
        "Longitudinal cohort study",
        "Statistical analysis of treatment outcomes over 6 months",
        ["regression", "survival-analysis", "time-series"],
        180,
    )
    
    expect(result.ok).toBe(1)
    
    const analysis = getAnalysis(1)
    expect(analysis).toBeDefined()
    expect(analysis.methodology).toBe("Longitudinal cohort study")
    expect(analysis.expectedDuration).toBe(180)
    expect(analysis.status).toBe("registered")
    expect(analysis.statisticalMethods).toEqual(["regression", "survival-analysis", "time-series"])
  })
  
  it("should reject analysis with invalid duration", () => {
    const result = registerAnalysis(
        1,
        "Test methodology",
        "Parameters",
        ["method1"],
        0, // invalid duration
    )
    
    expect(result.error).toBe("ERR_INVALID_PARAMETERS")
  })
  
  it("should start analysis execution", () => {
    registerAnalysis(1, "Method", "Params", ["stats"], 90)
    
    const result = startAnalysis(1)
    expect(result.ok).toBe(true)
    
    const analysis = getAnalysis(1)
    expect(analysis.status).toBe("running")
  })
  
  it("should reject start analysis from non-researcher", () => {
    registerAnalysis(1, "Method", "Params", ["stats"], 90)
    
    const result = startAnalysis(1, mockOtherUser)
    expect(result.error).toBe("ERR_UNAUTHORIZED")
  })
  
  it("should reject start analysis if not registered", () => {
    registerAnalysis(1, "Method", "Params", ["stats"], 90)
    startAnalysis(1) // Start it first
    
    const result = startAnalysis(1) // Try to start again
    expect(result.error).toBe("ERR_INVALID_PARAMETERS")
  })
  
  it("should complete analysis with results", () => {
    const resultsHash = "abc123def456"
    
    registerAnalysis(1, "Method", "Params", ["stats"], 90)
    startAnalysis(1)
    
    const result = completeAnalysis(1, resultsHash)
    expect(result.ok).toBe(true)
    
    const analysis = getAnalysis(1)
    expect(analysis.status).toBe("completed")
    expect(analysis.resultsHash).toBe(resultsHash)
  })
  
  it("should reject completion from non-researcher", () => {
    registerAnalysis(1, "Method", "Params", ["stats"], 90)
    startAnalysis(1)
    
    const result = completeAnalysis(1, "hash", mockOtherUser)
    expect(result.error).toBe("ERR_UNAUTHORIZED")
  })
  
  it("should reject completion if not running", () => {
    registerAnalysis(1, "Method", "Params", ["stats"], 90)
    // Don't start the analysis
    
    const result = completeAnalysis(1, "hash")
    expect(result.error).toBe("ERR_INVALID_PARAMETERS")
  })
  
  it("should handle non-existent analysis operations", () => {
    expect(startAnalysis(999).error).toBe("ERR_ANALYSIS_NOT_FOUND")
    expect(completeAnalysis(999, "hash").error).toBe("ERR_ANALYSIS_NOT_FOUND")
    expect(getAnalysis(999)).toBe(null)
  })
  
  it("should track analysis lifecycle correctly", () => {
    registerAnalysis(1, "Method", "Params", ["stats"], 90)
    
    let analysis = getAnalysis(1)
    expect(analysis.status).toBe("registered")
    expect(analysis.resultsHash).toBe(null)
    
    startAnalysis(1)
    analysis = getAnalysis(1)
    expect(analysis.status).toBe("running")
    
    completeAnalysis(1, "final-results-hash")
    analysis = getAnalysis(1)
    expect(analysis.status).toBe("completed")
    expect(analysis.resultsHash).toBe("final-results-hash")
  })
  
  it("should store complex analysis parameters", () => {
    const complexMethods = ["multivariate-regression", "propensity-score-matching", "bayesian-analysis"]
    const complexParams =
        "Adjusted for age, gender, comorbidities, socioeconomic status. Primary endpoint: 30-day readmission. Secondary endpoints: mortality, quality of life scores."
    
    registerAnalysis(5, "Real-world evidence study using electronic health records", complexParams, complexMethods, 365)
    
    const analysis = getAnalysis(1)
    expect(analysis.cohortId).toBe(5)
    expect(analysis.parameters).toBe(complexParams)
    expect(analysis.statisticalMethods).toEqual(complexMethods)
    expect(analysis.expectedDuration).toBe(365)
  })
})

console.log("✅ Analytics Protocol tests completed")
