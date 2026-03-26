import React, { useState } from 'react';
import { FormDesigner, DynamicForm, Tabs, type FormSchema } from '@dxp/ui';

export function FormBuilder() {
  const [savedSchema, setSavedSchema] = useState<FormSchema | null>(null);
  const [activeView, setActiveView] = useState('builder');

  const views = [
    { key: 'builder', label: 'Form Builder' },
    ...(savedSchema ? [{ key: 'test', label: 'Test Form' }] : []),
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--dxp-text)]">Form Builder</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Design forms visually — export as JSON for any portal page</p>
      </div>

      <div className="mb-6">
        <Tabs tabs={views} active={activeView} onChange={setActiveView} variant="underline" />
      </div>

      {activeView === 'builder' && (
        <FormDesigner
          initialSchema={savedSchema || undefined}
          onSave={(schema) => {
            setSavedSchema(schema);
            setActiveView('test');
          }}
        />
      )}

      {activeView === 'test' && savedSchema && (
        <div className="max-w-2xl mx-auto">
          <DynamicForm
            schema={savedSchema}
            onSubmit={(data) => alert('Form submitted:\n' + JSON.stringify(data, null, 2))}
          />
        </div>
      )}
    </div>
  );
}
