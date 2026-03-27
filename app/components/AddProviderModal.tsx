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
    category: "freshPerishables",
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
        category: "freshPerishables",
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
    { value: "freshPerishables", label: t("freshPerishables") },
    { value: "groceryDry", label: t("groceryDry") },
    { value: "beveragesSnacks", label: t("beveragesSnacks") },
    { value: "frozenFoods", label: t("frozenFoods") },
    { value: "householdPersonal", label: t("householdPersonal") },
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
          background: rgba(5, 5, 20, 0.65);
          backdrop-filter: blur(12px);
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.25s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .glass-modal {
          background: linear-gradient(145deg, rgba(20, 14, 50, 0.95), rgba(30, 20, 70, 0.92));
          backdrop-filter: blur(24px);
          border: 1px solid rgba(139, 92, 246, 0.25);
          box-shadow:
            0 0 0 1px rgba(139, 92, 246, 0.1),
            0 30px 60px rgba(0, 0, 0, 0.5),
            0 0 80px rgba(109, 40, 217, 0.08);
          border-radius: 24px;
          width: 90%;
          max-width: 600px;
          overflow: hidden;
          position: relative;
          animation: modalAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Top accent stripe */
        .glass-modal::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed);
          z-index: 1;
        }

        @keyframes modalAppear {
          from { opacity: 0; transform: scale(0.94) translateY(24px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-header {
          padding: 28px 32px 24px;
          border-bottom: 1px solid rgba(139, 92, 246, 0.15);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: rgba(109, 40, 217, 0.06);
        }

        .header-content h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #a78bfa, #e879f9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
          font-size: 0.85rem;
          color: rgba(167, 139, 250, 0.8);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .select-input, input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(109, 40, 217, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: #e2d9f3;
          font-size: 0.95rem;
          transition: all 0.25s;
        }

        .select-input option {
          background: #1e1446;
          color: #e2d9f3;
        }

        .select-input:focus, input:focus {
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15), 0 0 20px rgba(139, 92, 246, 0.1);
          outline: none;
          background: rgba(109, 40, 217, 0.14);
        }

        .select-input::placeholder, input::placeholder {
          color: rgba(167, 139, 250, 0.35);
        }

        .input-error {
          border-color: rgba(248, 113, 113, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1) !important;
        }

        .error-text {
          font-size: 0.8rem;
          color: #f87171;
          margin-top: 4px;
          display: block;
        }

        .form-error-banner {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          color: #fca5a5;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
        }

        .toggle-group { margin-top: 4px; }

        .toggle-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toggle-switch {
          width: 48px;
          height: 24px;
          border-radius: 24px;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.2);
          position: relative;
          cursor: pointer;
          transition: all 0.3s;
        }

        .toggle-switch.on {
          background: rgba(109, 40, 217, 0.6);
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow: 0 0 12px rgba(109, 40, 217, 0.4);
        }

        .toggle-knob {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(167, 139, 250, 0.6);
          position: absolute;
          top: 3px;
          left: 3px;
          transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .on .toggle-knob {
          background: #a78bfa;
          transform: translateX(24px);
          box-shadow: 0 0 8px rgba(167, 139, 250, 0.6);
        }

        .toggle-label {
          font-size: 0.85rem;
          color: rgba(167, 139, 250, 0.5);
          font-weight: 600;
        }

        .toggle-label.active {
          color: #a78bfa;
          text-shadow: 0 0 10px rgba(167, 139, 250, 0.4);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          margin-top: 12px;
          padding-top: 20px;
          border-top: 1px solid rgba(139, 92, 246, 0.12);
        }

        .haptic-btn {
          transition: transform 0.1s, filter 0.2s;
        }

        .haptic-btn:active { transform: scale(0.95); }

        .btn-close {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: #a78bfa;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-close:hover {
          background: rgba(139, 92, 246, 0.2);
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.2);
        }

        .btn-cancel {
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: rgba(167, 139, 250, 0.8);
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: rgba(139, 92, 246, 0.12);
        }

        .btn-save {
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(109, 40, 217, 0.4);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-save:hover {
          filter: brightness(1.12);
          box-shadow: 0 12px 32px rgba(109, 40, 217, 0.55);
          transform: translateY(-1px);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .premium-toast {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #059669, #10b981);
          color: white;
          padding: 12px 24px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
          animation: slideUpToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          white-space: nowrap;
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

