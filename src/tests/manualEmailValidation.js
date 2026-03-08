/**
 * Manual Email Integration Validation Script
 * 
 * Copy and paste this into the browser console to manually test email integration functionality.
 * This bypasses the need for Jest and provides immediate feedback on email system functionality.
 */

// Test data
const testAppointment = {
  id: 'manual-test-appointment',
  title: 'Manual Test Meeting',
  description: 'Testing email integration manually',
  type: 'meeting',
  date: '2024-01-15',
  startTime: '10:00',
  endTime: '11:00',
  location: 'Test Room',
  projectId: 'project-1',
  attendees: ['test@example.com'],
  teamMembers: ['team1'],
  equipment: ['projector'],
  priority: 'medium',
  customerNotification: true,
  reminderTime: '15',
  isRecurring: false,
  recurrencePattern: {
    type: 'none',
    interval: 1,
    endType: 'never',
    endDate: undefined,
    occurrences: undefined,
    dayOfMonth: undefined,
    weekDay: undefined
  },
  emailNotifications: {
    enabled: true,
    sendInvitations: true,
    sendReminders: true,
    recipients: [],
    customMessage: ''
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const testVariables = {
  appointmentTitle: 'Manual Test Meeting',
  appointmentDate: '15. Januar 2024',
  appointmentTime: '10:00',
  appointmentEndTime: '11:00',
  appointmentLocation: 'Test Room',
  appointmentType: 'Besprechung',
  appointmentPriority: 'Normal',
  appointmentDescription: 'Testing email integration manually',
  organizerName: 'Test Organizer',
  organizerEmail: 'organizer@example.com',
  recipientName: 'Test Recipient',
  recipientEmail: 'recipient@example.com',
  companyName: 'Bauplan Buddy GmbH',
  projectName: 'Test Project',
  projectCustomer: 'Test Customer',
  systemUrl: 'https://bauplan-buddy.com',
  supportEmail: 'support@bauplan-buddy.com',
  customFields: {
    location: 'Test Room',
    equipment: 'Projector'
  }
};

const testRecipients = [
  {
    email: 'test@example.com',
    name: 'Test Recipient',
    role: 'attendee',
    type: 'to'
  }
];

const testOrganizer = {
  name: 'Test Organizer',
  email: 'organizer@example.com'
};

// Manual validation functions
function validateEmailTemplateService() {
  console.log('🧪 Validating Email Template Service...');
  
  try {
    // Import the service dynamically
    import('/src/services/emailTemplateService.js').then(({ EmailTemplateService }) => {
      // Test getting templates
      const invitationTemplate = EmailTemplateService.getTemplate('invitation');
      console.log('✅ Template retrieval:', invitationTemplate ? 'SUCCESS' : 'FAILED');
      
      if (invitationTemplate) {
        // Test template rendering
        const rendered = EmailTemplateService.renderTemplate('invitation', testVariables);
        console.log('✅ Template rendering:', rendered ? 'SUCCESS' : 'FAILED');
        
        if (rendered) {
          console.log('📧 Rendered email preview:');
          console.log('Subject:', rendered.subject);
          console.log('Text content (first 200 chars):', rendered.textContent.substring(0, 200) + '...');
          
          // Check variable substitution
          const hasVariables = rendered.subject.includes(testVariables.appointmentTitle) &&
                              rendered.textContent.includes(testVariables.recipientName);
          console.log('✅ Variable substitution:', hasVariables ? 'SUCCESS' : 'FAILED');
        }
      }
    }).catch(error => {
      console.error('❌ EmailTemplateService import failed:', error);
    });
  } catch (error) {
    console.error('❌ EmailTemplateService validation failed:', error);
  }
}

function validateCalendarInviteService() {
  console.log('🧪 Validating Calendar Invite Service...');
  
  try {
    import('/src/services/calendarInviteService.js').then(({ CalendarInviteService }) => {
      // Test calendar invite generation
      const invite = CalendarInviteService.generateCalendarInvite(
        testAppointment,
        'REQUEST',
        testOrganizer,
        testRecipients
      );
      
      console.log('✅ Calendar invite generation:', invite ? 'SUCCESS' : 'FAILED');
      
      if (invite) {
        console.log('📅 Calendar invite preview:');
        console.log('Filename:', invite.filename);
        console.log('Content size:', invite.content.length, 'characters');
        console.log('Content preview (first 300 chars):', invite.content.substring(0, 300) + '...');
        
        // Check for required iCalendar fields
        const requiredFields = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'SUMMARY:', 'DTSTART:', 'DTEND:'];
        const hasAllFields = requiredFields.every(field => invite.content.includes(field));
        console.log('✅ RFC 5545 compliance:', hasAllFields ? 'SUCCESS' : 'FAILED');
        
        if (!hasAllFields) {
          const missingFields = requiredFields.filter(field => !invite.content.includes(field));
          console.log('❌ Missing fields:', missingFields);
        }
      }
    }).catch(error => {
      console.error('❌ CalendarInviteService import failed:', error);
    });
  } catch (error) {
    console.error('❌ CalendarInviteService validation failed:', error);
  }
}

function validateEmailService() {
  console.log('🧪 Validating Email Service...');
  
  try {
    import('/src/services/emailService.js').then(({ emailService }) => {
      // Test configuration retrieval
      const config = emailService.getConfig();
      console.log('✅ Email service config:', config ? 'SUCCESS' : 'FAILED');
      
      if (config) {
        console.log('⚙️ Email service configuration:');
        console.log('Enabled:', config.enabled);
        console.log('Provider:', config.provider?.provider || 'Not configured');
        console.log('Rate limits configured:', !!config.rateLimits);
        console.log('Monitoring configured:', !!config.monitoring);
      }
      
      // Test email validation
      const validEmail = emailService.validateEmail('test@example.com');
      const invalidEmail = emailService.validateEmail('invalid-email');
      
      console.log('✅ Email validation - valid email:', validEmail.isValid ? 'SUCCESS' : 'FAILED');
      console.log('✅ Email validation - invalid email:', !invalidEmail.isValid ? 'SUCCESS' : 'FAILED');
      
    }).catch(error => {
      console.error('❌ EmailService import failed:', error);
    });
  } catch (error) {
    console.error('❌ EmailService validation failed:', error);
  }
}

function validateComponents() {
  console.log('🧪 Validating Email Components...');
  
  const components = [
    'EmailNotificationSettings',
    'EmailSystemSettings',
    'CalendarInviteManager'
  ];
  
  components.forEach(componentName => {
    try {
      import(`/src/components/${componentName}.tsx`).then(() => {
        console.log(`✅ ${componentName} component: SUCCESS`);
      }).catch(error => {
        console.log(`❌ ${componentName} component: FAILED -`, error.message);
      });
    } catch (error) {
      console.log(`❌ ${componentName} component: FAILED -`, error.message);
    }
  });
}

function runCompleteValidation() {
  console.log('🚀 Starting Complete Email Integration Validation...\n');
  console.log('This will test all email integration components.\n');
  
  validateEmailTemplateService();
  setTimeout(() => validateCalendarInviteService(), 500);
  setTimeout(() => validateEmailService(), 1000);
  setTimeout(() => validateComponents(), 1500);
  
  setTimeout(() => {
    console.log('\n✅ Email integration validation completed!');
    console.log('Check the output above for any failed tests.');
    console.log('\n💡 To test individual components:');
    console.log('- validateEmailTemplateService()');
    console.log('- validateCalendarInviteService()');
    console.log('- validateEmailService()');
    console.log('- validateComponents()');
  }, 2000);
}

// Test if we're running in a browser environment
if (typeof window !== 'undefined') {
  console.log('📧 Email Integration Manual Validation Script Loaded');
  console.log('Run: runCompleteValidation() to test all email functionality');
  
  // Make functions available globally
  window.validateEmailTemplateService = validateEmailTemplateService;
  window.validateCalendarInviteService = validateCalendarInviteService;
  window.validateEmailService = validateEmailService;
  window.validateComponents = validateComponents;
  window.runCompleteValidation = runCompleteValidation;
} else {
  // Node.js environment
  module.exports = {
    validateEmailTemplateService,
    validateCalendarInviteService,
    validateEmailService,
    validateComponents,
    runCompleteValidation
  };
}

// Auto-run in development mode
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('\n🔧 Development mode detected. Email validation functions available.');
  console.log('Type runCompleteValidation() in the console to test email integration.');
}