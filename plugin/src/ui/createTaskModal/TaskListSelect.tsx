import type React from "react";
import { Button, ListBox, ListBoxItem, Popover, Select } from "react-aria-components";

import type { TaskList } from "@/api/domain/taskList";
import { ObsidianIcon } from "@/ui/components/obsidian-icon";

type Props = {
  lists: TaskList[];
  value: string;
  onChange: (listId: string) => void;
};

export const TaskListSelect: React.FC<Props> = ({ lists, value, onChange }) => {
  const selected = lists.find((l) => l.id === value);

  return (
    <Select
      className="task-list-select"
      aria-label="List"
      selectedKey={value}
      onSelectionChange={(key) => onChange(String(key))}
    >
      <Button className="task-list-select-trigger" aria-label="List">
        <span className="task-list-select-value">{selected?.title ?? ""}</span>
        <ObsidianIcon id="chevron-down" size="s" className="task-list-select-chevron" />
      </Button>
      <Popover className="task-option-dialog task-list-select-popover" placement="bottom start">
        <ListBox className="task-list-select-listbox" aria-label="Task lists">
          {lists.map((l) => (
            <ListBoxItem
              key={l.id}
              id={l.id}
              className="task-list-select-option"
              textValue={l.title}
            >
              {l.title}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
};
