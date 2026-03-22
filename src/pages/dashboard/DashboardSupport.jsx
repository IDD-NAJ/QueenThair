import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Send, Mail, Phone } from 'lucide-react';
import { submitContactMessage } from '../../services/contactService';
import useStore from '../../store/useStore';

export default function DashboardSupport() {
  const user = useStore(state => state.user);
  const showToast = useStore(state => state.showToast);
  
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🚀 Submitting support message...');
      
      const result = await submitContactMessage({
        name: user.email?.split('@')[0] || 'Customer',
        email: user.email,
        subject: formData.subject,
        message: formData.message
      });
      
      console.log('✅ Support message submitted:', result);
      showToast('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ subject: '', message: '' });
    } catch (err) {
      console.error('❌ Failed to submit support message:', err);
      const errorMessage = err.message || 'Failed to send message. Please try again.';
      showToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support & Help</h1>
        <p className="text-gray-600">Get help with your orders and account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Send us a message</h3>
                <p className="text-sm text-gray-600">We typically respond within 24 hours</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="What can we help you with?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="Please describe your issue or question in detail..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* Contact Info & FAQs */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">support@Queenthair.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">1-800-QUEEN-HAIR</p>
                  <p className="text-xs text-gray-500">Mon-Fri, 9am-6pm EST</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            
            <div className="space-y-2">
              <a href="/faq" className="block text-sm text-gold hover:text-gold-dark">
                Frequently Asked Questions
              </a>
              <a href="/shipping-returns" className="block text-sm text-gold hover:text-gold-dark">
                Shipping & Returns
              </a>
              <a href="/track-order" className="block text-sm text-gold hover:text-gold-dark">
                Track Your Order
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Common Issues */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Common Questions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">How do I track my order?</h4>
            <p className="text-sm text-gray-600">
              Go to your Orders page and click on any order to see its tracking information.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">What's your return policy?</h4>
            <p className="text-sm text-gray-600">
              We offer 30-day returns on all unworn items with tags attached.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">How do I change my order?</h4>
            <p className="text-sm text-gray-600">
              Contact us within 24 hours of placing your order to make changes.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Do you ship internationally?</h4>
            <p className="text-sm text-gray-600">
              Yes! We ship to most countries worldwide. Shipping times vary by location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
