/**
 * Simple Circuit Breaker implementation to prevent repeated failed API calls
 * 
 * This implementation tracks failed requests to endpoints and temporarily
 * blocks new requests to the same endpoint after a threshold of failures
 * has been reached.
 */

interface CircuitBreakerOptions {
  failureThreshold: number;  // Number of failures before opening the circuit
  resetTimeout: number;      // Time in ms before trying again (closing the circuit)
}

enum CircuitState {
  CLOSED = 'CLOSED',         // Normal operation, requests are allowed
  OPEN = 'OPEN',             // Circuit is open, requests are blocked
  HALF_OPEN = 'HALF_OPEN'    // Testing if service is back, allowing one request
}

interface CircuitTracking {
  failures: number;          // Current count of consecutive failures
  state: CircuitState;       // Current state of the circuit
  lastFailure: number;       // Timestamp of the last failure
  nextAttempt: number;       // Timestamp when next attempt is allowed
}

class CircuitBreaker {
  private circuits: Map<string, CircuitTracking> = new Map();
  private options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: 3,    // Open after 3 consecutive failures
      resetTimeout: 30000,    // Try again after 30 seconds
      ...options
    };
  }

  /**
   * Check if a request to the given endpoint is allowed
   * @param endpoint The API endpoint to check
   * @returns boolean True if request is allowed, false if circuit is open
   */
  public canRequest(endpoint: string): boolean {
    if (!this.circuits.has(endpoint)) {
      // Initialize circuit for this endpoint if it doesn't exist
      this.circuits.set(endpoint, {
        failures: 0,
        state: CircuitState.CLOSED,
        lastFailure: 0,
        nextAttempt: 0
      });
      return true;
    }

    const circuit = this.circuits.get(endpoint)!;
    const now = Date.now();

    // If circuit is OPEN but reset timeout has passed, transition to HALF_OPEN
    if (circuit.state === CircuitState.OPEN && now >= circuit.nextAttempt) {
      console.log(`Circuit for ${endpoint} transitioning from OPEN to HALF_OPEN`);
      circuit.state = CircuitState.HALF_OPEN;
    }

    return circuit.state !== CircuitState.OPEN;
  }

  /**
   * Record a successful request to the endpoint
   * @param endpoint The API endpoint that succeeded
   */
  public recordSuccess(endpoint: string): void {
    if (!this.circuits.has(endpoint)) return;

    const circuit = this.circuits.get(endpoint)!;
    
    // If we had a successful request after a HALF_OPEN state, reset the circuit
    if (circuit.state === CircuitState.HALF_OPEN || circuit.failures > 0) {
      console.log(`Circuit for ${endpoint} reset after successful request`);
      circuit.failures = 0;
      circuit.state = CircuitState.CLOSED;
    }
  }

  /**
   * Record a failed request to the endpoint
   * @param endpoint The API endpoint that failed
   */
  public recordFailure(endpoint: string): void {
    if (!this.circuits.has(endpoint)) {
      this.circuits.set(endpoint, {
        failures: 1,
        state: CircuitState.CLOSED,
        lastFailure: Date.now(),
        nextAttempt: 0
      });
      return;
    }

    const circuit = this.circuits.get(endpoint)!;
    circuit.failures += 1;
    circuit.lastFailure = Date.now();

    // If in HALF_OPEN and a failure occurs, go back to OPEN with a new timeout
    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.state = CircuitState.OPEN;
      circuit.nextAttempt = Date.now() + this.options.resetTimeout;
      console.log(`Circuit for ${endpoint} failed in HALF_OPEN state, returning to OPEN until ${new Date(circuit.nextAttempt)}`);
    } 
    // If we've reached the failure threshold, open the circuit
    else if (circuit.state === CircuitState.CLOSED && circuit.failures >= this.options.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      circuit.nextAttempt = Date.now() + this.options.resetTimeout;
      console.log(`Circuit for ${endpoint} OPENED after ${circuit.failures} failures. Will try again at ${new Date(circuit.nextAttempt)}`);
    }
  }

  /**
   * Get the current state of a circuit
   * @param endpoint The API endpoint to check
   */
  public getCircuitState(endpoint: string): CircuitState {
    if (!this.circuits.has(endpoint)) {
      return CircuitState.CLOSED;
    }
    return this.circuits.get(endpoint)!.state;
  }

  /**
   * Reset a specific circuit
   * @param endpoint The API endpoint to reset
   */
  public resetCircuit(endpoint: string): void {
    if (this.circuits.has(endpoint)) {
      console.log(`Circuit for ${endpoint} manually reset`);
      this.circuits.set(endpoint, {
        failures: 0,
        state: CircuitState.CLOSED,
        lastFailure: 0,
        nextAttempt: 0
      });
    }
  }

  /**
   * Reset all circuits
   */
  public resetAllCircuits(): void {
    console.log('All circuits manually reset');
    this.circuits.clear();
  }
}

// Create a singleton instance
const circuitBreaker = new CircuitBreaker();
export default circuitBreaker;
export { CircuitState };
