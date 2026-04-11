import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5004/api";

// Production API function with authentication
const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('clocked_token');
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
};

export default function GrievancePage() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    handle: "",
    contentUrl: "",
    description: "",
    type: "",
    isSubject: "",
    declarations: [false, false, false],
    supportingDocs: [],
    contactPreference: "email"
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [fileUploading, setFileUploading] = useState(false);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.handle.trim()) {
      newErrors.handle = "Handle is required";
    } else if (!form.handle.startsWith('@')) {
      newErrors.handle = "Handle must start with @";
    }

    if (!form.contentUrl.trim()) {
      newErrors.contentUrl = "Content URL is required";
    } else {
      try {
        new URL(form.contentUrl);
      } catch {
        newErrors.contentUrl = "Please enter a valid URL";
      }
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.trim().length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    } else if (form.description.trim().length > 2000) {
      newErrors.description = "Description must be less than 2000 characters";
    }

    if (!form.type) {
      newErrors.type = "Issue type is required";
    }

    if (!form.isSubject) {
      newErrors.isSubject = "Please specify your relationship to this issue";
    }

    const allDeclarationsChecked = form.declarations.every(Boolean);
    if (!allDeclarationsChecked) {
      newErrors.declarations = "All legal declarations must be checked";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const update = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    // Clear error when user starts typing
    if (errors[k]) {
      setErrors((prev) => ({ ...prev, [k]: "" }));
    }
  };

  const toggleDeclaration = (i) => {
    const next = [...form.declarations];
    next[i] = !next[i];
    setForm((p) => ({ ...p, declarations: next }));
    if (errors.declarations) {
      setErrors((prev) => ({ ...prev, declarations: "" }));
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setFileUploading(true);
    const uploadedDocs = [];

    try {
      for (const file of files) {
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File ${file.name} is not a supported format. Please use JPG, PNG, GIF, PDF, or TXT.`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await apiFetch('/grievance/upload', {
          method: 'POST',
          body: formData,
          headers: {}, // Let browser set Content-Type for FormData
        });

        uploadedDocs.push({
          id: response.fileId,
          name: file.name,
          url: response.url,
          type: file.type
        });
      }

      setForm((p) => ({ ...p, supportingDocs: [...p.supportingDocs, ...uploadedDocs] }));
    } catch (error) {
      alert(error.message || "File upload failed");
    } finally {
      setFileUploading(false);
      e.target.value = ''; // Clear file input
    }
  };

  const removeDocument = (docId) => {
    setForm((p) => ({
      ...p,
      supportingDocs: p.supportingDocs.filter(doc => doc.id !== docId)
    }));
  };

  const submit = async () => {
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('[data-error="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setLoading(true);
      
      const grievanceData = {
        ...form,
        ipAddress: window.clientIP || 'unknown', // Will be set by server
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        status: 'pending',
        caseId: `GRV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };

      const response = await apiFetch('/grievance', {
        method: 'POST',
        body: JSON.stringify(grievanceData),
      });

      setSuccess(true);
      
      // Log for analytics
      console.log('Grievance submitted:', {
        caseId: response.caseId,
        type: form.type,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Grievance submission error:', error);
      alert(error.message || "Submission failed. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  // Get client IP for legal compliance
  useEffect(() => {
    const getIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        window.clientIP = data.ip;
      } catch {
        window.clientIP = 'unknown';
      }
    };
    getIP();
  }, []);

  if (success) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>Request Submitted</h2>
          <p style={styles.successMessage}>
            Your grievance has been submitted successfully. We will review and respond within 24–72 hours.
          </p>
          <div style={styles.caseInfo}>
            <strong>Case ID:</strong> GRV-{Date.now().toString().slice(-6)}-{Math.random().toString(36).substr(2, 4).toUpperCase()}
          </div>
          <p style={styles.successSubtext}>
            You will receive an email confirmation shortly. Please save this case ID for your records.
          </p>
          <button 
            style={styles.secondaryButton}
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <strong>Clocked</strong>
        <div style={styles.headerNav}>
          <button 
            style={styles.navButton}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </button>
        </div>
      </div>

      <div style={styles.container}>
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>Grievance & Takedown</h1>
          <p style={styles.heroSubtext}>
            Submit a legal request for content removal or policy violation. We take these matters seriously and will respond promptly.
          </p>
          <div style={styles.legalNotice}>
            <strong>⚖️ Legal Notice:</strong> False claims may result in legal action. Please ensure all information is accurate.
          </div>
        </div>

        <div style={styles.card} data-error={!!errors.name || !!errors.email}>
          <h3 style={styles.cardTitle}>👤 Your Details</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Legal Name *</label>
            <input 
              placeholder="Enter your full legal name"
              style={{...styles.input, ...(errors.name && styles.inputError)}}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              data-error={!!errors.name}
            />
            {errors.name && <div style={styles.errorMessage}>{errors.name}</div>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address *</label>
            <input 
              type="email"
              placeholder="your.email@example.com"
              style={{...styles.input, ...(errors.email && styles.inputError)}}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              data-error={!!errors.email}
            />
            {errors.email && <div style={styles.errorMessage}>{errors.email}</div>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Preferred Contact Method</label>
            <select 
              style={styles.input}
              value={form.contactPreference}
              onChange={(e) => update("contactPreference", e.target.value)}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        <div style={styles.card} data-error={!!errors.handle || !!errors.contentUrl || !!errors.type || !!errors.isSubject || !!errors.description}>
          <h3 style={styles.cardTitle}>📄 Content Details</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Instagram Handle *</label>
            <input 
              placeholder="@username"
              style={{...styles.input, ...(errors.handle && styles.inputError)}}
              value={form.handle}
              onChange={(e) => update("handle", e.target.value)}
              data-error={!!errors.handle}
            />
            {errors.handle && <div style={styles.errorMessage}>{errors.handle}</div>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Content URL *</label>
            <input 
              placeholder="https://clocked.app/flag/..."
              style={{...styles.input, ...(errors.contentUrl && styles.inputError)}}
              value={form.contentUrl}
              onChange={(e) => update("contentUrl", e.target.value)}
              data-error={!!errors.contentUrl}
            />
            {errors.contentUrl && <div style={styles.errorMessage}>{errors.contentUrl}</div>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Issue Type *</label>
            <select 
              style={{...styles.input, ...(errors.type && styles.inputError)}}
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              data-error={!!errors.type}
            >
              <option value="">Select Issue Type</option>
              <option value="false_information">False Information</option>
              <option value="defamation">Defamation</option>
              <option value="harassment">Harassment</option>
              <option value="impersonation">Impersonation</option>
              <option value="privacy_violation">Privacy Violation</option>
              <option value="copyright">Copyright Infringement</option>
              <option value="hate_speech">Hate Speech</option>
              <option value="other">Other</option>
            </select>
            {errors.type && <div style={styles.errorMessage}>{errors.type}</div>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Your Relationship to This Issue *</label>
            <select 
              style={{...styles.input, ...(errors.isSubject && styles.inputError)}}
              value={form.isSubject}
              onChange={(e) => update("isSubject", e.target.value)}
              data-error={!!errors.isSubject}
            >
              <option value="">Select your relationship</option>
              <option value="subject">I am the subject</option>
              <option value="representative">Legal representative</option>
              <option value="family_member">Family member</option>
              <option value="authorized_agent">Authorized agent</option>
              <option value="concerned_third_party">Concerned third party</option>
            </select>
            {errors.isSubject && <div style={styles.errorMessage}>{errors.isSubject}</div>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Detailed Description *</label>
            <textarea 
              placeholder="Please provide a detailed description of the issue, including specific concerns and desired resolution..."
              style={{...styles.textarea, ...(errors.description && styles.inputError)}}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              data-error={!!errors.description}
              rows={6}
            />
            <div style={styles.charCount}>
              {form.description.length}/2000 characters
            </div>
            {errors.description && <div style={styles.errorMessage}>{errors.description}</div>}
          </div>
        </div>

        <div style={styles.card} data-error={!!errors.declarations}>
          <h3 style={styles.cardTitle}>⚖️ Legal Declarations</h3>
          <p style={styles.declarationIntro}>
            Please read and confirm each declaration. These are legally binding statements.
          </p>
          
          {[
            {
              text: "I declare under penalty of perjury that this information is accurate and complete",
              detail: "False statements may result in legal consequences"
            },
            {
              text: "I understand that misuse of this system may result in legal action",
              detail: "Frivolous or malicious claims are prohibited"
            },
            {
              text: "I agree to the Terms of Service and Legal Policy",
              detail: "Including dispute resolution and jurisdiction clauses"
            }
          ].map((item, i) => (
            <div key={i} style={styles.declarationItem}>
              <label style={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={form.declarations[i]}
                  onChange={() => toggleDeclaration(i)}
                  style={styles.checkbox}
                />
                <div style={styles.checkboxContent}>
                  <div style={styles.checkboxText}>{item.text}</div>
                  <div style={styles.checkboxDetail}>{item.detail}</div>
                </div>
              </label>
            </div>
          ))}
          
          {errors.declarations && <div style={styles.errorMessage}>{errors.declarations}</div>}
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📎 Supporting Documents (Optional)</h3>
          <p style={styles.uploadIntro}>
            Upload supporting documents (ID, legal notices, screenshots, etc.). Max 5MB per file.
          </p>
          
          <input 
            type="file" 
            multiple 
            accept=".jpg,.jpeg,.png,.gif,.pdf,.txt"
            onChange={handleFileUpload}
            disabled={fileUploading}
            style={{display: 'none'}}
            id="file-upload"
          />
          
          <label htmlFor="file-upload" style={styles.uploadButton}>
            {fileUploading ? "Uploading..." : "📎 Choose Files"}
          </label>

          {form.supportingDocs.length > 0 && (
            <div style={styles.uploadedFiles}>
              {form.supportingDocs.map((doc) => (
                <div key={doc.id} style={styles.fileItem}>
                  <span style={styles.fileName}>{doc.name}</span>
                  <button 
                    style={styles.removeFile}
                    onClick={() => removeDocument(doc.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          style={{...styles.button, ...(loading && styles.buttonDisabled)}}
          onClick={submit}
          disabled={loading}
        >
          {loading ? "⏳ Submitting..." : "⚖️ Submit Legal Request"}
        </button>

        <div style={styles.footerNotice}>
          <p>
            <strong>Important:</strong> This submission creates a legal record. 
            All information will be handled according to our Privacy Policy and applicable laws.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { 
    fontFamily: "DM Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
    background: "linear-gradient(135deg, #F8F7F3 0%, #F0EFEB 100%)", 
    minHeight: "100vh",
    color: "#1a1a1a"
  },
  header: { 
    padding: "1rem 2rem", 
    background: "#fff", 
    borderBottom: "1px solid #e5e4de",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerNav: {
    display: "flex",
    gap: "1rem"
  },
  navButton: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid #e5e4de",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.875rem"
  },
  container: { 
    maxWidth: 800, 
    margin: "0 auto", 
    padding: "2rem 1rem"
  },
  hero: { 
    marginBottom: "2rem",
    textAlign: "center"
  },
  heroTitle: {
    fontSize: "2.5rem",
    fontWeight: "800",
    marginBottom: "1rem",
    color: "#1a1a1a",
    lineHeight: "1.2"
  },
  heroSubtext: {
    fontSize: "1.125rem",
    color: "#666",
    marginBottom: "1.5rem",
    lineHeight: "1.6",
    maxWidth: "600px",
    margin: "0 auto 1.5rem"
  },
  legalNotice: {
    background: "#fef3f2",
    border: "1px solid #fcd9d7",
    borderRadius: "8px",
    padding: "1rem",
    fontSize: "0.875rem",
    color: "#d93025",
    marginBottom: "1rem"
  },
  card: { 
    background: "#fff", 
    padding: "2rem", 
    borderRadius: 12, 
    border: "1px solid #e5e4de", 
    marginBottom: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    marginBottom: "1.5rem",
    color: "#1a1a1a"
  },
  formGroup: {
    marginBottom: "1.5rem"
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "600",
    fontSize: "0.875rem",
    color: "#333"
  },
  input: { 
    width: "100%", 
    padding: "12px 16px", 
    marginBottom: "0.5rem", 
    borderRadius: 8, 
    border: "1px solid #ccc",
    fontSize: "1rem",
    transition: "all 0.2s ease",
    boxSizing: "border-box"
  },
  inputError: {
    borderColor: "#e2353a",
    boxShadow: "0 0 0 2px rgba(226, 53, 58, 0.1)"
  },
  textarea: { 
    width: "100%", 
    padding: "12px 16px", 
    minHeight: 140, 
    borderRadius: 8, 
    border: "1px solid #ccc",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
    transition: "all 0.2s ease"
  },
  charCount: {
    fontSize: "0.75rem",
    color: "#666",
    textAlign: "right",
    marginTop: "0.25rem"
  },
  errorMessage: {
    color: "#e2353a",
    fontSize: "0.875rem",
    marginTop: "0.5rem",
    fontWeight: "500"
  },
  declarationIntro: {
    fontSize: "0.875rem",
    color: "#666",
    marginBottom: "1rem",
    fontStyle: "italic"
  },
  declarationItem: {
    marginBottom: "1rem"
  },
  checkboxLabel: {
    display: "flex",
    gap: "12px",
    cursor: "pointer",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #e5e4de",
    transition: "background-color 0.2s ease"
  },
  checkbox: {
    marginTop: "2px",
    transform: "scale(1.2)"
  },
  checkboxContent: {
    flex: 1
  },
  checkboxText: {
    fontWeight: "600",
    fontSize: "0.875rem",
    marginBottom: "0.25rem"
  },
  checkboxDetail: {
    fontSize: "0.75rem",
    color: "#666",
    lineHeight: "1.4"
  },
  uploadIntro: {
    fontSize: "0.875rem",
    color: "#666",
    marginBottom: "1rem"
  },
  uploadButton: {
    display: "inline-block",
    padding: "12px 24px",
    background: "#f8f7f3",
    border: "2px dashed #ccc",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "600",
    textAlign: "center",
    transition: "all 0.2s ease"
  },
  uploadedFiles: {
    marginTop: "1rem"
  },
  fileItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem",
    background: "#f8f7f3",
    borderRadius: "6px",
    marginBottom: "0.5rem"
  },
  fileName: {
    fontSize: "0.875rem",
    color: "#333"
  },
  removeFile: {
    background: "#e2353a",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: "0.75rem"
  },
  button: { 
    width: "100%", 
    padding: "16px 24px", 
    background: "linear-gradient(135deg, #e2353a 0%, #c5282f 100%)", 
    color: "#fff", 
    border: "none", 
    borderRadius: 10, 
    fontWeight: "700",
    fontSize: "1.125rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(226, 53, 58, 0.3)"
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  footerNotice: {
    background: "#f8f7f3",
    padding: "1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    color: "#666",
    marginTop: "1rem"
  },
  // Success page styles
  successIcon: {
    fontSize: "4rem",
    marginBottom: "1rem"
  },
  successTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "1rem",
    color: "#1a9e5f"
  },
  successMessage: {
    fontSize: "1.125rem",
    color: "#333",
    marginBottom: "1.5rem",
    lineHeight: "1.6"
  },
  caseInfo: {
    background: "#f8f7f3",
    padding: "1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    marginBottom: "1rem",
    fontFamily: "monospace"
  },
  successSubtext: {
    fontSize: "0.875rem",
    color: "#666",
    marginBottom: "2rem"
  },
  secondaryButton: {
    padding: "12px 24px",
    background: "#fff",
    color: "#333",
    border: "1px solid #ccc",
    borderRadius: 8,
    fontWeight: "600",
    cursor: "pointer"
  }
};
