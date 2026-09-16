# AI Provider Abstraction & LangGraph Readiness

## Design Philosophy

LeadForge AI strictly delineates between **deterministic operations** and **semantic reasoning**:

- **Deterministic Operations (NO AI):**
  - Database search queries
  - Filtering by status, city, or date
  - Sorting and pagination
  - Aggregate dashboard counts
  - Direct state changes
- **Semantic Reasoning (Gemini AI):**
  - Evaluating website diagnostic deficiencies
  - Generating individualized value propositions
  - Analyzing technical audit notes to formulate pitch angles
  - Classifying partner responses and incoming inquiries

## Provider Interface

```typescript
export interface IAIProvider {
  name: string;
  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  analyzeOpportunity(input: AIOpportunityAnalysisInput): Promise<ProviderExecutionResult<AIOpportunityAnalysisResult>>;
  generatePersonalizedPitch(input: {
    businessName: string;
    contactName?: string;
    opportunityReason: string;
  }): Promise<ProviderExecutionResult<string>>;
}
```

## Google Gemini Integration
The production implementation uses Google Gemini (`gemini-1.5-flash`) with structured JSON schema outputs.

If `GEMINI_API_KEY` is not present in production:
- The system returns `configured: false, error: "Provider not configured"`.
- It never fakes completion or simulates live AI inferences in production.
- `MockAIProvider` is active only when `DEMO_MODE=true` is explicitly set.

## LangGraph / LangChain Migration Path
In Phase 2, the `IAIProvider` interface can be wrapped as a node in a LangGraph state machine to coordinate multi-agent research:
1. `ResearchAgent`: Scans verified public CA disclosures.
2. `AuditAgent`: Evaluates page speed, SSL, and mobile friendliness.
3. `PitchAgent`: Formulates customized value proposition drafts.
4. `HumanReviewGate`: Halts execution until an agency user confirms the draft.
