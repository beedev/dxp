import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from '../primitives/Slider';

const meta: Meta<typeof Slider> = { title: 'Primitives/Slider', component: Slider };
export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => <Slider min={0} max={100} defaultValue={50} label="Coverage Amount" />,
};
export const Currency: Story = {
  render: () => <Slider min={100} max={5000} step={100} defaultValue={1000} label="Deductible" formatValue={(v) => `$${v.toLocaleString()}`} />,
};
export const Percentage: Story = {
  render: () => <Slider min={0} max={100} defaultValue={75} label="Confidence" formatValue={(v) => `${v}%`} />,
};
