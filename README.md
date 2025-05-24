# Decentralized Healthcare Population Analytics

A blockchain-based system for secure, privacy-preserving healthcare population analytics using Clarity smart contracts on the Stacks blockchain.

## Overview

This system enables healthcare researchers to conduct population-level analytics while maintaining data privacy and ensuring transparent, verifiable research methodologies. The platform consists of five core smart contracts that work together to create a comprehensive analytics ecosystem.

## Core Components

### 1. Data Provider Verification Contract
- **Purpose**: Validates and manages healthcare data sources
- **Features**:
    - Provider registration and verification
    - Certification tracking
    - Data type classification
    - Status management (pending/verified)

### 2. Population Definition Contract
- **Purpose**: Defines and manages analysis cohorts
- **Features**:
    - Cohort creation with demographic criteria
    - Age range and condition specifications
    - Geographic region targeting
    - Sample size management

### 3. Analytics Protocol Contract
- **Purpose**: Records analysis methodologies and execution
- **Features**:
    - Methodology registration
    - Statistical method tracking
    - Analysis execution monitoring
    - Results hash storage

### 4. Privacy Preservation Contract
- **Purpose**: Ensures data anonymization and privacy compliance
- **Features**:
    - K-anonymity and L-diversity enforcement
    - Differential privacy support
    - Anonymization record keeping
    - Compliance verification

### 5. Insight Distribution Contract
- **Purpose**: Manages sharing of population health findings
- **Features**:
    - Research insight publication
    - Access control management
    - Peer review tracking
    - Public/private access modes

## Key Features

- **Privacy-First**: Built-in privacy preservation mechanisms
- **Transparent**: All methodologies and processes recorded on-chain
- **Verifiable**: Cryptographic verification of data integrity
- **Decentralized**: No single point of control or failure
- **Compliant**: Designed with healthcare regulations in mind

## Smart Contract Architecture

\`\`\`
┌─────────────────────┐    ┌─────────────────────┐
│ Data Provider       │    │ Population          │
│ Verification        │    │ Definition          │
└─────────┬───────────┘    └─────────┬───────────┘
│                          │
└──────────┬─────────────────┘
│
┌─────────────────────┐
│ Analytics Protocol  │
└─────────┬───────────┘
│
┌───────────────┼───────────────┐
│               │               │
┌───▼────────┐ ┌────▼────────┐ ┌───▼──────────┐
│ Privacy    │ │ Insight     │ │ Access       │
│ Preservation│ │ Distribution│ │ Control      │
└────────────┘ └─────────────┘ └──────────────┘
\`\`\`

## Getting Started

### Prerequisites
- Stacks blockchain node or testnet access
- Clarity development environment
- Node.js for testing

### Installation

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Run tests: \`npm test\`
4. Deploy contracts to testnet

### Usage Example

\`\`\`clarity
;; Register as a data provider
(contract-call? .data-provider-verification register-provider
"Hospital XYZ"
"HIPAA-Certified"
(list "demographics" "diagnoses" "treatments"))

;; Create a population cohort
(contract-call? .population-definition create-cohort
"Diabetes Study Cohort"
"Adults with Type 2 diabetes in urban areas"
u18 u65
(list "diabetes-type-2")
"Urban-US"
u1000)

;; Register analysis methodology
(contract-call? .analytics-protocol register-analysis
u1  ;; cohort-id
"Longitudinal cohort study"
"Statistical analysis of treatment outcomes"
(list "regression" "survival-analysis")
u180)  ;; 180 days
\`\`\`

## Privacy and Security

- **K-Anonymity**: Minimum group size requirements
- **L-Diversity**: Sensitive attribute diversity
- **Differential Privacy**: Mathematical privacy guarantees
- **Hash Verification**: Data integrity protection
- **Access Controls**: Granular permission management

## Testing

The project includes comprehensive tests using Vitest:

\`\`\`bash
npm test
\`\`\`

Tests cover:
- Contract deployment and initialization
- Provider registration and verification
- Cohort creation and management
- Analysis protocol execution
- Privacy compliance verification
- Insight publication and access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Compliance

This system is designed to support compliance with:
- HIPAA (Health Insurance Portability and Accountability Act)
- GDPR (General Data Protection Regulation)
- FDA guidelines for real-world evidence
- IRB (Institutional Review Board) requirements

## Support

For questions or support, please open an issue in the GitHub repository.

