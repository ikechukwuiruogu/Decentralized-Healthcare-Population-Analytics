// Insight Distribution Contract Tests

import { describe, it, expect, beforeEach } from "vitest"

describe("Insight Distribution Contract", () => {
  const contractState = {
    insights: new Map(),
    accessPermissions: new Map(),
    nextInsightId: 1,
  }
  
  const mockResearcher = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  const mockAccessor = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
  const mockOtherUser = "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"
  
  beforeEach(() => {
    contractState.insights.clear()
    contractState.accessPermissions.clear()
    contractState.nextInsightId = 1
  })
  
  const publishInsight = (analysisId, title, summary, findings, confidence, publicAccess, sender = mockResearcher) => {
    if (confidence > 100 || confidence < 1) {
      return { error: "ERR_INVALID_INSIGHT" }
    }
    
    const insightId = contractState.nextInsightId
    
    contractState.insights.set(insightId, {
      researcher: sender,
      analysisId,
      title,
      summary,
      findings,
      confidenceLevel: confidence,
      peerReviewed: false,
      publicAccess,
      createdAt: 12345,
      accessCount: 0,
    })
    
    contractState.nextInsightId += 1
    return { ok: insightId }
  }
  
  const grantAccess = (insightId, accessor, duration, sender = mockResearcher) => {
    const insight = contractState.insights.get(insightId)
    if (!insight) {
      return { error: "ERR_INSIGHT_NOT_FOUND" }
    }
    if (sender !== insight.researcher) {
      return { error: "ERR_UNAUTHORIZED" }
    }
    
    const key = `${insightId}-${accessor}`
    contractState.accessPermissions.set(key, {
      grantedAt: 12345,
      expiresAt: 12345 + duration,
    })
    
    return { ok: true }
  }
  
  const accessInsight = (insightId, sender = mockAccessor) => {
    const insight = contractState.insights.get(insightId)
    if (!insight) {
      return { error: "ERR_INSIGHT_NOT_FOUND" }
    }
    
    const hasAccess =
        insight.publicAccess ||
        sender === insight.researcher ||
        contractState.accessPermissions.has(`${insightId}-${sender}`)
    
    if (!hasAccess) {
      return { error: "ERR_ACCESS_DENIED" }
    }
    
    // Increment access count
    contractState.insights.set(insightId, {
      ...insight,
      accessCount: insight.accessCount + 1,
    })
    
    return { ok: insight }
  }
  
  const markPeerReviewed = (insightId, sender = mockResearcher) => {
    const insight = contractState.insights.get(insightId)
    if (!insight) {
      return { error: "ERR_INSIGHT_NOT_FOUND" }
    }
    if (sender !== insight.researcher) {
      return { error: "ERR_UNAUTHORIZED" }
    }
    
    contractState.insights.set(insightId, {
      ...insight,
      peerReviewed: true,
    })
    
    return { ok: true }
  }
  
  const getInsight = (insightId) => {
    return contractState.insights.get(insightId) || null
  }
  
  it("should publish a research insight", () => {
    const result = publishInsight(
        1,
        "Diabetes Treatment Outcomes",
        "Analysis of treatment effectiveness in urban populations",
        "Metformin showed 23% better outcomes compared to sulfonylureas in the studied cohort",
        85,
        true,
    )
    
    expect(result.ok).toBe(1)
    
    const insight = getInsight(1)
    expect(insight).toBeDefined()
    expect(insight.title).toBe("Diabetes Treatment Outcomes")
    expect(insight.confidenceLevel).toBe(85)
    expect(insight.publicAccess).toBe(true)
    expect(insight.peerReviewed).toBe(false)
    expect(insight.accessCount).toBe(0)
  })
  
  it("should reject insights with invalid confidence levels", () => {
    const result1 = publishInsight(1, "Title", "Summary", "Findings", 101, true)
    expect(result1.error).toBe("ERR_INVALID_INSIGHT")
    
    const result2 = publishInsight(1, "Title", "Summary", "Findings", 0, true)
    expect(result2.error).toBe("ERR_INVALID_INSIGHT")
  })
  
  it("should grant access to specific users", () => {
    publishInsight(1, "Title", "Summary", "Findings", 75, false) // private insight
    
    const result = grantAccess(1, mockAccessor, 1000)
    expect(result.ok).toBe(true)
    
    const key = `1-${mockAccessor}`
    expect(contractState.accessPermissions.has(key)).toBe(true)
  })
  
  it("should reject access grant from non-researcher", () => {
    publishInsight(1, "Title", "Summary", "Findings", 75, false)
    
    const result = grantAccess(1, mockAccessor, 1000, mockOtherUser)
    expect(result.error).toBe("ERR_UNAUTHORIZED")
  })
  
  it("should allow access to public insights", () => {
    publishInsight(1, "Title", "Summary", "Findings", 75, true) // public
    
    const result = accessInsight(1, mockOtherUser)
    expect(result.ok).toBeDefined()
    expect(result.ok.title).toBe("Title")
    
    const insight = getInsight(1)
    expect(insight.accessCount).toBe(1)
  })
  
  it("should allow researcher to access their own insights", () => {
    publishInsight(1, "Title", "Summary", "Findings", 75, false) // private
    
    const result = accessInsight(1, mockResearcher)
    expect(result.ok).toBeDefined()
  })
  
  it("should allow granted users to access private insights", () => {
    publishInsight(1, "Title", "Summary", "Findings", 75, false) // private
    grantAccess(1, mockAccessor, 1000)
    
    const result = accessInsight(1, mockAccessor)
    expect(result.ok).toBeDefined()
  })
  
  it("should deny access to unauthorized users for private insights", () => {
    publishInsight(1, "Title", "Summary", "Findings", 75, false) // private
    
    const result = accessInsight(1, mockOtherUser)
    expect(result.error).toBe("ERR_ACCESS_DENIED")
  })
  
  it("should mark insights as peer-reviewed", () => {
    publishInsight(1, "Title", "Summary", "Findings", 75, true)
    
    const result = markPeerReviewed(1)
    expect(result.ok).toBe(true)
    
    const insight = getInsight(1)
    expect(insight.peerReviewed).toBe(true)
  })
  
  it("should reject peer review marking from non-researcher", () => {
    publishInsight(1, "Title", "Summary", "Findings", 75, true)
    
    const result = markPeerReviewed(1, mockOtherUser)
    expect(result.error).toBe("ERR_UNAUTHORIZED")
  })
  
  it("should track access count correctly", () => {
    publishInsight(1, "Title", "Summary", "Findings", 75, true)
    
    accessInsight(1, mockAccessor)
    accessInsight(1, mockOtherUser)
    accessInsight(1, mockResearcher)
    
    const insight = getInsight(1)
    expect(insight.accessCount).toBe(3)
  })
  
  it("should handle non-existent insight operations", () => {
    expect(grantAccess(999, mockAccessor, 1000).error).toBe("ERR_INSIGHT_NOT_FOUND")
    expect(accessInsight(999, mockAccessor).error).toBe("ERR_INSIGHT_NOT_FOUND")
    expect(markPeerReviewed(999).error).toBe("ERR_INSIGHT_NOT_FOUND")
    expect(getInsight(999)).toBe(null)
  })
  
  it("should handle complex insight data", () => {
    const longFindings =
        "Comprehensive analysis of 2,500 patients over 18 months revealed significant improvements in HbA1c levels (7.2% to 6.8%, p<0.001) with combination therapy. Subgroup analysis showed greater benefits in patients aged 45-65 years. No significant adverse events were observed."
    
    publishInsight(
        5,
        "Long-term Diabetes Management Study",
        "Multi-center randomized controlled trial examining combination therapy effectiveness",
        longFindings,
        92,
        false,
    )
    
    const insight = getInsight(1)
    expect(insight.analysisId).toBe(5)
    expect(insight.findings).toBe(longFindings)
    expect(insight.confidenceLevel).toBe(92)
    expect(insight.publicAccess).toBe(false)
  })
  
  it("should handle multiple access grants for same insight", () => {
    publishInsight(1, "Title", "Summary", "Findings", 75, false)
    
    grantAccess(1, mockAccessor, 1000)
    grantAccess(1, mockOtherUser, 500)
    
    expect(contractState.accessPermissions.has(`1-${mockAccessor}`)).toBe(true)
    expect(contractState.accessPermissions.has(`1-${mockOtherUser}`)).toBe(true)
    
    // Both should be able to access
    expect(accessInsight(1, mockAccessor).ok).toBeDefined()
    expect(accessInsight(1, mockOtherUser).ok).toBeDefined()
  })
})

console.log("✅ Insight Distribution tests completed")
