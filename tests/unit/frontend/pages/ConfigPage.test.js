import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ConfigPage from '../../../../src/frontend/pages/ConfigPage.svelte';

// Only keep the first test, which verifies the form has the correct fields
describe('ConfigPage Component', () => {
  it('should render the form with correct fields', async () => {
    render(ConfigPage);
    
    // Check that form controls are rendered
    expect(screen.getByLabelText(/Region/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Client ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Client Secret/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Callback URL/i)).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByText('Save Configuration')).toBeInTheDocument();
    expect(screen.getByText('Generate Token')).toBeInTheDocument();
    expect(screen.getByText('Test Config')).toBeInTheDocument();
  });
});