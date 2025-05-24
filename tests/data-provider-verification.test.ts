// Data Provider Verification Contract Tests

import { describe, it, expect, beforeEach } from "vitest"

describe("Data Provider Verification Contract", () => {
  const contractState = {
    providers: new Map(),
    nextProviderId: 1,
    contractOwner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  }
  
  const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  const mockProvider = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
  
  beforeEach(() => {
    contractState.providers.clear()
    contractState.nextProviderId = 1
  })
  
  // Simulate contract functions
  const registerProvider = (name, certification, dataTypes, sender = mockProvider) => {
    const providerId = contractState.nextProviderId
    
    if (contractState.providers.has(providerId)) {
      return { error: "ERR_PROVIDER_EXISTS" }
    }
    
    contractState.providers.set(providerId, {
      address: sender,
      name,
      certification,
      status: "pending",
      verifiedAt: 0,
      dataTypes,
    })
    
    contractState.nextProviderId += 1
    return { ok: providerId }
  }
  
  const verifyProvider = (providerId, sender = mockTxSender) => {
    if (sender !== contractState.contractOwner) {
      return { error: "ERR_UNAUTHORIZED" }
    }
    
    const provider = contractState.providers.get(providerId)
    if (!provider) {
      return { error: "ERR_PROVIDER_NOT_FOUND" }
    }
    
    contractState.providers.set(providerId, {
      ...provider,
      status: "verified",
      verifiedAt: 12345, // mock block height
    })
    
    return { ok: true }
  }
  
  const getProvider = (providerId) => {
    return contractState.providers.get(providerId) || null
  }
  
  const isProviderVerified = (providerId) => {
    const provider = contractState.providers.get(providerId)
    return provider ? provider.status === "verified" : false
  }
  
  it("should register a new data provider", () => {
    const result = registerProvider("Hospital ABC", "HIPAA-Certified", ["demographics", "diagnoses"])
    
    expect(result.ok).toBe(1)
    
    const provider = getProvider(1)
    expect(provider).toBeDefined()
    expect(provider.name).toBe("Hospital ABC")
    expect(provider.status).toBe("pending")
    expect(provider.dataTypes).toEqual(["demographics", "diagnoses"])
  })
  
  it("should verify a data provider (admin only)", () => {
    // First register a provider
    registerProvider("Hospital XYZ", "HIPAA-Certified", ["treatments"])
    
    // Verify the provider
    const result = verifyProvider(1)
    expect(result.ok).toBe(true)
    
    const provider = getProvider(1)
    expect(provider.status).toBe("verified")
    expect(provider.verifiedAt).toBe(12345)
  })
  
  it("should reject verification from non-admin", () => {
    registerProvider("Hospital XYZ", "HIPAA-Certified", ["treatments"])
    
    const result = verifyProvider(1, mockProvider)
    expect(result.error).toBe("ERR_UNAUTHORIZED")
  })
  
  it("should check if provider is verified", () => {
    registerProvider("Hospital ABC", "HIPAA-Certified", ["demographics"])
    
    expect(isProviderVerified(1)).toBe(false)
    
    verifyProvider(1)
    expect(isProviderVerified(1)).toBe(true)
  })
  
  it("should handle non-existent provider verification", () => {
    const result = verifyProvider(999)
    expect(result.error).toBe("ERR_PROVIDER_NOT_FOUND")
  })
  
  it("should increment provider IDs correctly", () => {
    const result1 = registerProvider("Provider 1", "Cert1", ["type1"])
    const result2 = registerProvider("Provider 2", "Cert2", ["type2"])
    
    expect(result1.ok).toBe(1)
    expect(result2.ok).toBe(2)
    expect(contractState.nextProviderId).toBe(3)
  })
  
  it("should store provider data correctly", () => {
    const dataTypes = ["demographics", "diagnoses", "treatments", "outcomes"]
    registerProvider("Comprehensive Hospital", "Joint Commission", dataTypes)
    
    const provider = getProvider(1)
    expect(provider.address).toBe(mockProvider)
    expect(provider.certification).toBe("Joint Commission")
    expect(provider.dataTypes).toEqual(dataTypes)
  })
})

console.log("✅ Data Provider Verification tests completed")
