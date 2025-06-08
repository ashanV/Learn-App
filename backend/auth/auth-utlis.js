import { auth } from '../config/firebase-config.js';
import { fetchSignInMethodsForEmail } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Checks if email is already registered
export async function checkEmailExists(email) {
    try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        return signInMethods.length > 0;
    } catch (error) {
        console.error('Błąd sprawdzania email:', error);
        return false;
    }
}

// Password Validation
export function validatePassword(password) {
    const errors = [];
    
    if (password.length < 6) {
        errors.push('Hasło musi mieć co najmniej 6 znaków');
    }
    
    if (!/[A-Za-z]/.test(password)) {
        errors.push('Hasło musi zawierać co najmniej jedną literę');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Hasło powinno zawierać co najmniej jedną cyfrę');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Email Validation
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}