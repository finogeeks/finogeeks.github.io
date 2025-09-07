# Sandboxing for Agentic Systems — A Technical White Paper

**Draft · September 2025**

---

## Executive summary

Agentic systems — software that uses models to plan, decide, and act (often by executing scripts or controlling UIs) — amplify both capability and risk. Running untrusted agent-generated actions (code, browser automation, file operations, network requests) requires strong, well-architected isolation so that a single malicious or buggy agent cannot escalate to a full system compromise or data exfiltration.

This white paper introduces a practical taxonomy of sandboxing approaches relevant to agentic systems, compares trade-offs (security, performance, developer ergonomics), describes concrete architecture patterns (including the common cloud-decision / local-executor split for browser agents), and gives recommendations for choosing and composing sandbox techniques in production. Key references and real-world primitives (microVMs, containers + seccomp, WebAssembly, browser sandboxes, capability-based controls, and NeuronKit) are cited and linked for readers who want to implement or evaluate designs.      

---

## 1. Introduction: why sandboxing matters for agents

Agentic systems can generate or orchestrate actions that reach beyond pure text: they may synthesize code, click through web pages, use stored credentials, or manipulate local files. That capability creates these core hazards:

- **Untrusted-code execution**: agents may generate or receive code that must be executed (e.g., Python/JS snippets).
- **Data exfiltration**: instructions that read tokens, cookies, or files and send them to remote endpoints.
- **Privilege escalation / lateral movement**: one agent process should not be able to compromise co-tenants or host.
- **Supply-chain / persistence risks**: a benign-looking action (installing a package or browser extension) can create long-term attack surface.

Sandboxing reduces these risks by bounding what code can do and what resources it can access.

---

## 2. Threat model (short)

When evaluating sandboxes for agents, make explicit the assumed threats:

- **Host compromise by agent** (goal: run arbitrary native code / access host kernel).  
- **Data leakage** (goal: exfiltrate secrets / cookies / files).  
- **Cross-tenant attacks** (in multi-tenant cloud: one tenant affecting another).  
- **Supply-chain attacks** (agent causes installation of persistent backdoor).  
- **UI manipulation & phishing** (agent-controlled browser UI tricks user).

A sandbox’s design must be driven by which of these threats are in scope.

---

## 3. Taxonomy of sandbox categories

### 3.1 Hardware/VM-level sandboxes (VMs & microVMs)

**Description.**  
Full kernel-level isolation using virtualization. MicroVMs (e.g., Firecracker) are minimal VMMs optimized for short-lived workloads with low overhead and strong isolation.

**Strengths**  
- Strong isolation: kernel boundary prevents most host compromise vectors.  
- Mature attack surface model; easy to reason about tenancy separation.  

**Weaknesses**  
- Higher resource cost and startup latency than in-process solutions.  
- More operational complexity (images, orchestration).  

**When to use**  
- Running fully untrusted agent-generated code at scale.  
- Scenarios that require kernel separation (arbitrary native code execution).  

---

### 3.2 Container-level sandboxes + kernel policies

**Description.**  
Lightweight OS-level isolation (namespaces, cgroups) augmented with kernel filters (seccomp), LSMs (AppArmor/SELinux), and runtime sandboxes (gVisor, Kata Containers).

**Strengths**  
- Good performance and tooling ecosystem.  
- Fine-grained kernel-level control possible.  

**Weaknesses**  
- Weaker isolation than full VMs if kernel bugs or escapes exist.  
- Complex to configure correctly for absolute safety.  

**When to use**  
- Medium-risk workloads where performance matters with kernel-level hardening.  

---

### 3.3 Language/runtime-level sandboxes (WebAssembly, SFI)

**Description.**  
Execution in a language VM or via software fault isolation inside a process. WebAssembly (Wasm) is a portable, sandboxed binary format designed for running untrusted code with a constrained host interface.

**Strengths**  
- Very low startup latency; small resource footprint.  
- Strong capability discipline.  
- Good for language-agnostic plugin ecosystems.  

**Weaknesses**  
- Isolation is limited to process scope; host runtime bugs can be abused.  
- Wasm itself has security considerations.  

**When to use**  
- Plugin models, sandboxing algorithms, in-browser execution.  

---

### 3.4 Browser-level sandboxes (same-origin, iframe sandbox, CSP)

**Description.**  
Browsers implement multi-layer isolation: same-origin policy, site isolation, iframe sandbox attribute, CSP, and extension sandboxing.

**Strengths**  
- Designed to limit web content and cross-site data flow.  
- Good for agentic UI automation limited to DOM and browser APIs.  

**Weaknesses**  
- Extension permissions can be abused.  
- Requires strict permission minimization.  

**When to use**  
- Running agentic automation inside the browser.  

---

### 3.5 Process & kernel primitives (seccomp, namespaces, AppArmor/SELinux, pledge/jail)

**Description.**  
Additional knobs to harden containers/processes: block syscalls, limit capabilities, apply LSM policies, or use OS-level jail mechanisms.

**Strengths**  
- Granular control over resources.  
- Works inside containers/microVMs.  

**Weaknesses**  
- Requires meticulous policy engineering.  

**When to use**  
- As complementary controls for containers or processes.  

---

### 3.6 Capability-based and policy enforcement sandboxes

**Description.**  
Expose narrowly scoped capabilities (tokens/handles) that grant specific actions, reducing ambient authority.

**Strengths**  
- Strong principle of least privilege.  
- Fine-grained auditability.  

**Weaknesses**  
- Requires redesign of host APIs.  

**When to use**  
- Plugin ecosystems, browser agents with limited actions.  

---

### 3.7 NeuronKit Sandbox (hybrid policy + capability sandbox)

**Description.**  
NeuronKit introduces a distinctive sandbox model designed for agent–UI interaction in browsers. Unlike traditional sandboxes that constrain code or processes, NeuronKit mediates **semantic actions** through a **policy-driven capability model**.

It combines:  
- **Cloud-side decisioning**: agent plans actions.  
- **Local enforcement**: a browser-embedded DSL interpreter executes only permitted steps.  
- **Capability tokens**: minimal, time-boxed, least-privilege capabilities.  
- **Isolation layering**: sits inside the browser sandbox while exposing only explicit, policy-approved actions.  

**Strengths**  
- Fine-grained semantic control.  
- Lightweight, no VM/container overhead.  
- Bridges cloud–local trust gap.  

**Weaknesses**  
- Relies on correctness of DSL interpreter and policies.  
- No kernel barrier.  
- Needs disciplined policy management.  

**When to use**  
- Agentic systems focused on UI/browser automation.  
- Cases balancing security and UX.  
- As a complement to heavier compute isolation (microVMs/Wasm).  

**Diagram: NeuronKit Sandbox Model**