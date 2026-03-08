import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Textarea } from '../../ui/textarea';

export interface NotesSectionProps {
  notes: string;
  onChange: (value: string) => void;
}

export const DeliveryNoteNotesSection: React.FC<NotesSectionProps> = ({ notes, onChange }) => (
  <Card>
    <CardHeader>
      <CardTitle>Anmerkungen</CardTitle>
    </CardHeader>
    <CardContent>
      <Textarea
        value={notes}
        onChange={event => onChange(event.target.value)}
        placeholder="Zusaetzliche Anmerkungen zum Lieferschein"
        rows={4}
      />
    </CardContent>
  </Card>
);

