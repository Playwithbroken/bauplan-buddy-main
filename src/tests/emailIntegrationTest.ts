/**
 * Email Integration Validation Test
 * 
 * This file validates the email integration functionality by testing:
 * 1. Email service configuration
 * 2. Template rendering
 * 3. Calendar invite generation
 * 4. Component rendering
 * 5. Hook functionality
 * 
 * Run this in the browser console or as a script to validate email integration.
 */

import { EmailTemplateService } from '@/services/emailTemplateService';
import { CalendarInviteService } from '@/services/calendarInviteService';
import { EmailValidationService } from '@/services/emailValidationService';
import { emailService } from '@/services/emailService';
import { 
  EmailTemplateVariables, 
  EmailServiceConfig, 
  UserEmailPreferences,
  EmailRecipient,
  CalendarInvite
} from '@/types/email';
import { StoredAppointment } from '@/services/appointmentService';

// Test data
const testAppointment: StoredAppointment = {
  id: 'test-appointment-integration',
  title: 'Integration Test Meeting',
  description: 'Testing email integration functionality',
  type: 'meeting',
  date: '2024-01-15',
  startTime: '10:00',
  endTime: '11:00',
  location: 'Conference Room A',
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

const testVariables: EmailTemplateVariables = {
  appointmentTitle: 'Integration Test Meeting',
  appointmentDate: '15. Januar 2024',
  appointmentTime: '10:00',
  appointmentEndTime: '11:00',
  appointmentLocation: 'Conference Room A',
  appointmentType: 'Besprechung',
  appointmentPriority: 'Normal',
  appointmentDescription: 'Testing email integration functionality',
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
    location: 'Conference Room A',
    equipment: 'Projector, Whiteboard'
  }
};

const testRecipients: EmailRecipient[] = [
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

/**
 * Email Integration Test Suite
 */
class EmailIntegrationTest {
  private results: { test: string; status: 'PASS' | 'FAIL'; message: string; details?: unknown }[] = [];

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string, details?: unknown) {
    this.results.push({ test, status, message, details });
    console.log(`${status}: ${test} - ${message}`, details || '');
  }

  /**
   * Test 1: Email Template Service
   */
  testEmailTemplateService() {
    console.log('🧪 Testing Email Template Service...');
    
    try {
      // Test getting a template
      const invitationTemplate = EmailTemplateService.getTemplate('invitation');
      if (invitationTemplate) {
        this.addResult('EmailTemplateService.getTemplate', 'PASS', 'Successfully retrieved invitation template');
      } else {
        this.addResult('EmailTemplateService.getTemplate', 'FAIL', 'Could not retrieve invitation template');
        return;
      }

      // Test template rendering
      const rendered = EmailTemplateService.renderTemplate('invitation', testVariables);
      if (rendered) {
        this.addResult('EmailTemplateService.renderTemplate', 'PASS', 'Successfully rendered template with variables');
        
        // Validate rendered content
        if (rendered.subject.includes(testVariables.appointmentTitle) &&
            rendered.textContent.includes(testVariables.recipientName) &&
            rendered.htmlContent.includes(testVariables.appointmentDate)) {
          this.addResult('Template Variable Substitution', 'PASS', 'Variables correctly substituted in template');
        } else {
          this.addResult('Template Variable Substitution', 'FAIL', 'Variables not properly substituted');
        }
      } else {
        this.addResult('EmailTemplateService.renderTemplate', 'FAIL', 'Template rendering failed');
      }

      // Test template validation
      if (invitationTemplate) {
        const isValid = EmailTemplateService.validateTemplate(invitationTemplate);
        this.addResult('EmailTemplateService.validateTemplate', isValid ? 'PASS' : 'FAIL', 
          `Template validation ${isValid ? 'passed' : 'failed'}`);
      }

    } catch (error) {
      this.addResult('EmailTemplateService', 'FAIL', `Error testing template service: ${error.message}`);
    }
  }

  /**
   * Test 2: Calendar Invite Service
   */
  testCalendarInviteService() {
    console.log('🧪 Testing Calendar Invite Service...');
    
    try {
      // Test calendar invite generation
      const invite = CalendarInviteService.generateCalendarInvite(
        testAppointment,
        'REQUEST',
        testOrganizer,
        testRecipients
      );

      if (invite && invite.content && invite.filename) {
        this.addResult('CalendarInviteService.generateCalendarInvite', 'PASS', 'Successfully generated calendar invite');
        
        // Validate iCalendar content
        const requiredFields = [
          'BEGIN:VCALENDAR',
          'END:VCALENDAR',
          'VERSION:2.0',
          'PRODID:',
          'BEGIN:VEVENT',
          'END:VEVENT',
          'UID:',
          'DTSTART:',
          'DTEND:',
          'SUMMARY:'
        ];

        const missingFields = requiredFields.filter(field => !invite.content.includes(field));
        
        if (missingFields.length === 0) {
          this.addResult('iCalendar RFC 5545 Compliance', 'PASS', 'Calendar invite contains all required RFC 5545 fields');
        } else {
          this.addResult('iCalendar RFC 5545 Compliance', 'FAIL', 
            `Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate appointment details in invite
        if (invite.content.includes(testAppointment.title) &&
            invite.content.includes(testAppointment.description) &&
            invite.content.includes(testAppointment.location)) {
          this.addResult('Calendar Invite Content', 'PASS', 'Appointment details correctly included in invite');
        } else {
          this.addResult('Calendar Invite Content', 'FAIL', 'Appointment details missing from invite');
        }

        // Validate filename
        if (invite.filename.endsWith('.ics') && invite.filename.includes('2024-01-15')) {
          this.addResult('Calendar Invite Filename', 'PASS', 'Correct filename format generated');
        } else {
          this.addResult('Calendar Invite Filename', 'FAIL', `Incorrect filename: ${invite.filename}`);
        }

      } else {
        this.addResult('CalendarInviteService.generateCalendarInvite', 'FAIL', 'Calendar invite generation failed');
      }

    } catch (error) {
      this.addResult('CalendarInviteService', 'FAIL', `Error testing calendar invite service: ${error.message}`);
    }
  }

  /**
   * Test 3: Email Validation Service
   */
  testEmailValidation() {
    console.log('🧪 Testing Email Validation...');
    
    try {
      // Test valid email validation
      const validEmails = ['test@example.com', 'user@domain.org', 'admin@company.de'];
      let allValid = true;

      validEmails.forEach(email => {
        const result = EmailValidationService.validateEmail(email);
        if (!result.isValid) {
          allValid = false;
        }
      });

      if (allValid) {
        this.addResult('Email Validation - Valid Emails', 'PASS', 'All valid emails passed validation');
      } else {
        this.addResult('Email Validation - Valid Emails', 'FAIL', 'Some valid emails failed validation');
      }

      // Test invalid email validation
      const invalidEmails = ['invalid', 'test@', '@domain.com', 'test.domain.com'];
      let allInvalid = true;

      invalidEmails.forEach(email => {
        const result = EmailValidationService.validateEmail(email);
        if (result.isValid) {
          allInvalid = false;
        }
      });

      if (allInvalid) {
        this.addResult('Email Validation - Invalid Emails', 'PASS', 'All invalid emails correctly rejected');
      } else {
        this.addResult('Email Validation - Invalid Emails', 'FAIL', 'Some invalid emails incorrectly passed validation');
      }

    } catch (error) {
      this.addResult('EmailValidation', 'FAIL', `Error testing email validation: ${error.message}`);
    }
  }

  /**
   * Test 4: Email Service Configuration
   */
  testEmailServiceConfiguration() {
    console.log('🧪 Testing Email Service Configuration...');
    
    try {
      // Test getting default configuration
      const defaultConfig = emailService.getConfig();
      
      if (defaultConfig && typeof defaultConfig === 'object') {
        this.addResult('EmailService.getConfig', 'PASS', 'Successfully retrieved email service configuration');
        
        // Validate configuration structure
        const requiredProps = ['enabled', 'provider', 'rateLimits', 'retryPolicy', 'monitoring'];
        const missingProps = requiredProps.filter(prop => !(prop in defaultConfig));
        
        if (missingProps.length === 0) {
          this.addResult('Email Configuration Structure', 'PASS', 'Configuration has all required properties');
        } else {
          this.addResult('Email Configuration Structure', 'FAIL', 
            `Missing properties: ${missingProps.join(', ')}`);
        }
        
      } else {
        this.addResult('EmailService.getConfig', 'FAIL', 'Could not retrieve email service configuration');
      }

    } catch (error) {
      this.addResult('EmailServiceConfiguration', 'FAIL', `Error testing email service configuration: ${error.message}`);
    }
  }

  /**
   * Test 5: Component Type Imports
   */
  testComponentImports() {
    console.log('🧪 Testing Component Imports...');
    
    try {
      // Test if component files exist and are importable
      const componentTests = [
        'EmailNotificationSettings',
        'EmailSystemSettings', 
        'CalendarInviteManager'
      ];

      componentTests.forEach(componentName => {
        try {
          // This will test if the module can be resolved
          import(`@/components/${componentName}.tsx`).then(() => {
            this.addResult(`${componentName} Import`, 'PASS', 'Component successfully importable');
          }).catch(() => {
            this.addResult(`${componentName} Import`, 'FAIL', 'Component import failed');
          });
        } catch (error) {
          this.addResult(`${componentName} Import`, 'FAIL', `Component import error: ${error.message}`);
        }
      });

    } catch (error) {
      this.addResult('ComponentImports', 'FAIL', `Error testing component imports: ${error.message}`);
    }
  }

  /**
   * Test 6: Integration Workflow
   */
  testIntegrationWorkflow() {
    console.log('🧪 Testing Integration Workflow...');
    
    try {
      // Step 1: Generate template
      const template = EmailTemplateService.renderTemplate('invitation', testVariables);
      
      // Step 2: Generate calendar invite
      const calendarInvite = CalendarInviteService.generateCalendarInvite(
        testAppointment,
        'REQUEST',
        testOrganizer,
        testRecipients
      );

      // Step 3: Validate workflow
      if (template && calendarInvite) {
        this.addResult('Complete Email Workflow', 'PASS', 
          'Successfully completed template rendering and calendar invite generation workflow');
        
        // Test workflow data consistency
        if (template.subject.includes(testVariables.appointmentTitle) &&
            calendarInvite.content.includes(testAppointment.title)) {
          this.addResult('Workflow Data Consistency', 'PASS', 
            'Data consistency maintained across email template and calendar invite');
        } else {
          this.addResult('Workflow Data Consistency', 'FAIL', 
            'Data inconsistency between email template and calendar invite');
        }
        
      } else {
        this.addResult('Complete Email Workflow', 'FAIL', 'Workflow completion failed');
      }

    } catch (error) {
      this.addResult('IntegrationWorkflow', 'FAIL', `Error testing integration workflow: ${error.message}`);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Email Integration Tests...\n');
    
    this.testEmailTemplateService();
    this.testCalendarInviteService();
    this.testEmailValidation();
    this.testEmailServiceConfiguration();
    this.testComponentImports();
    this.testIntegrationWorkflow();
    
    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.printResults();
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n📊 Email Integration Test Results');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
    
    // Print detailed results
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
      if (result.details) {
        console.log(`   Details:`, result.details);
      }
    });
    
    console.log('\n' + '='.repeat(50));
    
    if (failed === 0) {
      console.log('🎉 All email integration tests passed! Email system is ready for use.');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please review the failing tests above.`);
    }
    
    return {
      total,
      passed,
      failed,
      successRate: (passed / total) * 100,
      results: this.results
    };
  }
}

// Export the test class
export { EmailIntegrationTest };

// Auto-run tests if this file is imported in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 Email Integration Test available. Run: new EmailIntegrationTest().runAllTests()');
}

// Default export for easy testing
export default EmailIntegrationTest;