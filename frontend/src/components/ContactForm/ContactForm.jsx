import { useState, useRef, useEffect } from 'react';
import "./ContactForm.css";
import "../ActionButton.css";

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState(''); // 'sending', 'success', 'error'
    const clearTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');

        try {
            // Using Web3Forms - free form backend service
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_key: 'f2dbbeba-b4b4-477a-83fe-c13c3f285716', // User needs to get this from https://web3forms.com/
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setStatus('success');
                setFormData({ name: '', email: '', subject: '', message: '' });
                if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
                clearTimerRef.current = setTimeout(() => setStatus(''), 5000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            setStatus('error');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                />
            </div>

            <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                />
            </div>

            <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="What's this about?"
                />
            </div>

            <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Your message..."
                />
            </div>

            <button
                type="submit"
                className="card-action-btn submit-btn"
                disabled={status === 'sending'}
            >
                {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>

            {status === 'success' && (
                <p className="form-status success">Message sent successfully! I'll get back to you soon.</p>
            )}

            {status === 'error' && (
                <p className="form-status error">Failed to send message. Please try emailing me directly at briandang730@gmail.com</p>
            )}
        </form>
    );
}
