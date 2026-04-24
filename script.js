/**
 * Contact Manager Logic
 * Handles adding, editing, deleting, and persisting contacts.
 */

class ContactManager {
    constructor() {
        this.contacts = JSON.parse(localStorage.getItem('contacts')) || [];
        this.form = document.getElementById('contact-form');
        this.listContainer = document.getElementById('contact-list');
        this.submitBtn = this.form.querySelector('button[type="submit"]');
        this.submitBtnText = document.getElementById('submit-btn-text');

        this.isEditing = false;
        this.editingId = null;

        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.renderContacts();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const messageInput = document.getElementById('message');

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const message = messageInput.value.trim();

        if (!name || !email || !phone || !message) {
            alert('Please fill in all fields.');
            return;
        }

        const contactData = { name, email, phone, message };

        if (this.isEditing) {
            this.updateContact(this.editingId, contactData);
        } else {
            // New Entry - Send to backend
            await this.sendToBackend(contactData);
        }
    }

    async sendToBackend(contactData) {
        const originalBtnText = this.submitBtnText.textContent;
        this.submitBtnText.textContent = 'Sending...';
        this.submitBtn.disabled = true;

        try {
            const response = await fetch("http://localhost:5000/api/contact", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: contactData.name,
                    email: contactData.email,
                    phone: contactData.phone,
                    message: contactData.message
                })
            });

            if (response.ok) {
                // Success! Add to local list
                this.addContact(contactData);
                this.resetForm();
                alert('Message sent successfully & contact added!');
            } else {
                const data = await response.json();
                if (data.error) {
                    alert(data.error);
                } else {
                    alert("Oops! There was a problem submitting your form");
                }
            }
        } catch (error) {
            console.error('Backend Error:', error);
            alert("Oops! There was a problem submitting your form");
        } finally {
            this.submitBtnText.textContent = originalBtnText;
            this.submitBtn.disabled = false;
        }
    }

    addContact(contact) {
        const newContact = {
            id: Date.now().toString(),
            ...contact,
            createdAt: new Date().toISOString()
        };

        this.contacts.push(newContact);
        this.saveContacts();
        this.renderContacts();
    }

    updateContact(id, updatedData) {
        this.contacts = this.contacts.map(contact =>
            contact.id === id ? { ...contact, ...updatedData } : contact
        );
        this.saveContacts();
        this.renderContacts();

        // Reset edit mode
        this.resetForm();
        alert('Contact updated locally!');
    }

    deleteContact(id) {
        if (confirm('Are you sure you want to delete this contact?')) {
            this.contacts = this.contacts.filter(contact => contact.id !== id);
            this.saveContacts();
            this.renderContacts();
        }
    }

    editContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (!contact) return;

        document.getElementById('name').value = contact.name;
        document.getElementById('email').value = contact.email;
        document.getElementById('phone').value = contact.phone;
        document.getElementById('message').value = contact.message;

        this.isEditing = true;
        this.editingId = id;
        this.submitBtnText.textContent = 'Update Contact';

        // Scroll to form
        document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' });
    }

    saveContacts() {
        localStorage.setItem('contacts', JSON.stringify(this.contacts));
    }

    resetForm() {
        this.form.reset();
        this.isEditing = false;
        this.editingId = null;
        this.submitBtnText.textContent = 'Send Message & Add Contact';
    }

    renderContacts() {
        if (!this.listContainer) return;

        this.listContainer.innerHTML = '';

        if (this.contacts.length === 0) {
            this.listContainer.innerHTML = `
                <li class="empty-state">
                    <i class="fas fa-address-book"></i>
                    <p>No contacts yet. Send a message to add one!</p>
                </li>
            `;
            return;
        }

        this.contacts.forEach(contact => {
            const li = document.createElement('li');
            li.className = 'contact-item';

            li.innerHTML = `
                <div class="contact-info">
                    <h4>${this.escapeHtml(contact.name)}</h4>
                    <div class="contact-detail-item">
                        <i class="fas fa-envelope"></i>
                        <span>${this.escapeHtml(contact.email)}</span>
                    </div>
                    <div class="contact-detail-item">
                        <i class="fas fa-phone"></i>
                        <span>${this.escapeHtml(contact.phone)}</span>
                    </div>
                    <div class="contact-detail-item">
                        <i class="fas fa-comment"></i>
                        <span class="message-preview" title="${this.escapeHtml(contact.message)}">
                            ${this.escapeHtml(contact.message).substring(0, 30)}${contact.message.length > 30 ? '...' : ''}
                        </span>
                    </div>
                </div>
                <div class="contact-actions">
                    <button class="btn-icon btn-edit" onclick="contactManager.editContact('${contact.id}')" title="Edit">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="contactManager.deleteContact('${contact.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            this.listContainer.appendChild(li);
        });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize
var contactManager = new ContactManager();
