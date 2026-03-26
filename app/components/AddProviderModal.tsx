"use client";

import { useState, useEffect } from "react";
import { useI18n } from "./I18nProvider";
import { X, Check, AlertCircle, Phone, Mail, User, Tag, ShieldCheck } from "lucide-react";
import { providerSchema } from "@/lib/schemas";
import { z } from "zod";

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (provider: any) => void;
  initialData?: any;
}

export function AddProviderModal({ isOpen, onClose, onSuccess, initialData }: AddProviderModalProps) {
  const { t, isRTL } = useI18n();
  
  const [formData, setFormData] = useState({
    name: "",
    category: "LOGISTICS",
    contactName: "",
    email: "",
    phone: "",
    status: "ACTIVE",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        category: initialData.category || "LOGISTICS",
        contactName: initialData.contactName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        status: initialData.status || "ACTIVE",
      });
    } else {
      setFormData({
        name: "",
        category: "LOGISTICS",
        contactName: "",
        email: "",
        phone: "",
        status: "ACTIVE",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Zod Validation
      providerSchema.parse(formData);

      const url = initialData ? `/api/providers/${initialData.id}` : "/api/providers";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save provider");
      }

      const saved = await res.json();
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onSuccess(saved);
        onClose();
      }, 1500);
      
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue: z.ZodIssue) => {
          fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ form: err.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: "LOGISTICS", label: t("logistics") || "Logistics" },
    { value: "RAW_MATERIALS", label: t("rawMaterials") || "Raw Materials" },
    { value: "TECH", label: t("tech") || "Tech" },
    { value: "FOOD_BEVERAGE", label: t("foodBeverage") || "Food & Beverage" },
    { value: "FURNITURE", label: t("furniture") || "Furniture" },
    { value: "OTHER", label: t("other") || "Other" },
  ];

  return (
    <div className="modal-overlay glass-overlay" onClick={onClose} dir={isRTL ? "rtl" : "ltr"}>
      <div className="modal-container glass-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="header-content">
            <h2 className="t-gradient">{initialData ? t("editProvider") : t("addProvider")}</h2>
            <p className="text-secondary">{t("providerDetailsDesc") || "Fill in the supplier information"}</p>
          </div>
          <button className="btn-close haptic-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          {errors.form && (
            <div className="form-error-banner">
              <AlertCircle size={18} /> {errors.form}
            </div>
          )}

          <div className="form-group">
            <label className="flex-center-gap">
              <User size={16} /> {t("providerName")} *
            </label>
            <input
              type="text"
              className={errors.name ? "input-error" : ""}
              placeholder="e.g. Acme Corp"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="flex-center-gap">
                <Tag size={16} /> {t("category")}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="select-input"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="flex-center-gap">
                <User size={16} /> {t("contactPerson")}
              </label>
              <input
                type="text"
                placeholder="Name"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="flex-center-gap">
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                className={errors.email ? "input-error" : ""}
                placeholder="contact@supplier.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="flex-center-gap">
                <Phone size={16} /> {t("phoneNumber") || "Phone Number"}
              </label>
              <input
                type="text"
                placeholder="+123..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group toggle-group">
            <label className="flex-center-gap">
              <ShieldCheck size={16} /> {t("status")}
            </label>
            <div className="toggle-container">
               <span className={formData.status === "INACTIVE" ? "toggle-label active" : "toggle-label"}>
                {t("inactive")}
              </span>
              <div 
                className={`toggle-switch ${formData.status === "ACTIVE" ? "on" : "off"}`}
                onClick={() => setFormData({ ...formData, status: formData.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}
              >
                <div className="toggle-knob" />
              </div>
              <span className={formData.status === "ACTIVE" ? "toggle-label active" : "toggle-label"}>
                {t("active")}
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel haptic-btn" onClick={onClose} disabled={isSubmitting}>
              {t("cancel")}
            </button>
            <button type="submit" className={`btn-save haptic-btn ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
              {isSubmitting ? <div className="spinner-small" /> : initialData ? t("update") : t("save")}
            </button>
          </div>
        </form>

        {showToast && (
          <div className="premium-toast">
            <Check size={18} /> {initialData ? "Updated Successfully!" : "Provider Added Successfully!"}
          </div>
        )}
      </div>

      <style jsx>{`
        .glass-overlay {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
        }

        .glass-modal {
          background: var(--bg-card-glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-color);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          border-radius: 24px;
          width: 90%;
          max-width: 600px;
          overflow: hidden;
          animation: modalAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalAppear {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-header {
          padding: 24px 32px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: rgba(255, 255, 255, 0.02);
        }

        .header-content h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
        }

        .modal-form {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .flex-center-gap {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .select-input, input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .select-input:focus, input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--accent-glow);
          outline: none;
        }

        .input-error {
          border-color: var(--error) !important;
        }

        .toggle-group {
          margin-top: 8px;
        }

        .toggle-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toggle-switch {
          width: 48px;
          height: 24px;
          border-radius: 24px;
          background: var(--border-color);
          position: relative;
          cursor: pointer;
          transition: background 0.3s;
        }

        .toggle-switch.on {
          background: var(--success);
        }

        .toggle-knob {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .on .toggle-knob {
          transform: translateX(24px);
        }

        .toggle-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .toggle-label.active {
          color: var(--text-primary);
          font-weight: 700;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          margin-top: 12px;
        }

        .haptic-btn {
          transition: transform 0.1s;
        }

        .haptic-btn:active {
          transform: scale(0.95);
        }

        .btn-cancel {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-save {
          background: var(--accent);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 20px var(--accent-glow);
        }

        .btn-save:hover {
          filter: brightness(1.1);
        }

        .premium-toast {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--success);
          color: white;
          padding: 12px 24px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
          animation: slideUpToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes slideUpToast {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
