import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoadingButton } from "./LoadingButton";

const meta: Meta<typeof LoadingButton> = {
  title: "Components/LoadingButton",
  component: LoadingButton,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary"],
    },
    loading: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingButton>;

export const Default: Story = {
  args: {
    children: "Submit",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: "Submitting...",
  },
};
