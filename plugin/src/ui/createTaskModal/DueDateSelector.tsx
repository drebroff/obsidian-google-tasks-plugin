import {
  type CalendarDate,
  DateFormatter,
  endOfWeek,
  type Time,
  toCalendarDateTime,
  toZoned,
} from "@internationalized/date";
import type React from "react";
import { useState } from "react";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DateSegment,
  Dialog,
  DialogTrigger,
  Heading,
  type Key,
  Label,
  Menu,
  MenuItem,
  Section,
  TimeField,
} from "react-aria-components";

import type { DueDate as ApiDueDate } from "@/api/domain/dueDate";
import { DueDate as DataDueDate } from "@/data/dueDate";
import { t } from "@/i18n";
import { timezone, today as todayInZone } from "@/infra/time";
import { ObsidianIcon } from "@/ui/components/obsidian-icon";
import { Popover } from "@/ui/createTaskModal/Popover";

const weekdayFormatter = new DateFormatter("en-US", {
  weekday: "short",
});

export type DueDate = {
  date: CalendarDate;
  timeInfo:
    | {
        time: Time;
      }
    | undefined;
};

type Props = {
  selected: DueDate | undefined;
  setSelected: (selected: DueDate | undefined) => void;
};

export const DueDateSelector: React.FC<Props> = ({ selected, setSelected }) => {
  const label = getLabel(selected);
  const suggestions = getSuggestions();

  const selectDate = (date: CalendarDate) => {
    if (selected === undefined) {
      setSelected({
        date,
        timeInfo: undefined,
      });
    } else {
      setSelected({
        date,
        timeInfo: selected.timeInfo,
      });
    }
  };

  const selectedDateSuggestion = (key: Key) => {
    const suggestion = suggestions.find((s) => s.id === key);
    if (suggestion === undefined) {
      return;
    }

    if (suggestion.target === undefined) {
      setSelected(undefined);
    } else {
      setSelected({
        date: suggestion.target,
        timeInfo: selected?.timeInfo,
      });
    }
  };

  const setTimeInfo = (timeInfo: DueDate["timeInfo"]) => {
    if (selected === undefined) {
      if (timeInfo !== undefined) {
        setSelected({
          date: todayInZone(),
          timeInfo,
        });
      }
    } else {
      setSelected({
        date: selected.date,
        timeInfo,
      });
    }
  };

  const i18n = t().createTaskModal.dateSelector;

  return (
    <DialogTrigger>
      <Button className="due-date-selector" aria-label={i18n.buttonLabel}>
        <ObsidianIcon size="s" id="calendar" />
        <span>{label}</span>
      </Button>
      <Popover maxHeight={600}>
        <Dialog className="task-option-dialog task-date-menu" aria-label={i18n.dialogLabel}>
          {({ close }) => (
            <>
              <Menu
                onAction={(key: Key) => {
                  selectedDateSuggestion(key);
                  close();
                }}
                aria-label={i18n.suggestionsLabel}
              >
                <Section>
                  {suggestions.map((props) => (
                    <DateSuggestion key={props.id} {...props} />
                  ))}
                </Section>
              </Menu>
              <hr />
              <Calendar
                aria-label={i18n.datePickerLabel}
                className="date-picker"
                value={selected?.date ?? null}
                onChange={(date) => {
                  selectDate(date);
                  close();
                }}
                minValue={todayInZone()}
              >
                <header>
                  <Heading level={4} />
                  <div className="date-picker-controls">
                    <Button slot="previous">◀</Button>
                    <Button slot="next">▶</Button>
                  </div>
                </header>
                <CalendarGrid>{(date) => <CalendarCell date={date} />}</CalendarGrid>
              </Calendar>
              <hr />
              <div className="time-picker-container">
                <DialogTrigger>
                  <Button className="time-picker-button" aria-label="Set time">
                    <ObsidianIcon size="xs" id="clock" />
                    Time
                  </Button>
                  <Popover defaultPlacement="top">
                    <TimeDialog selectedTimeInfo={selected?.timeInfo} setTimeInfo={setTimeInfo} />
                  </Popover>
                </DialogTrigger>
                {selected?.timeInfo !== undefined && (
                  <Button
                    className="time-picker-clear-button"
                    onPress={() => setTimeInfo(undefined)}
                    aria-label="Clear time"
                  >
                    <ObsidianIcon size="xs" id="cross" />
                  </Button>
                )}
              </div>
            </>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
};

const getLabel = (selected: DueDate | undefined) => {
  if (selected === undefined) {
    return t().createTaskModal.dateSelector.emptyDate;
  }

  let dateString: string;
  if (selected.timeInfo !== undefined) {
    dateString = toZoned(
      toCalendarDateTime(selected.date, selected.timeInfo.time),
      timezone(),
    ).toAbsoluteString();
  } else {
    dateString = selected.date.toString();
  }

  const apiDueDate: ApiDueDate = {
    date: dateString,
    isRecurring: false,
  };

  const dueDate = DataDueDate.parse(apiDueDate);

  return DataDueDate.format(dueDate);
};

type DateSuggestionProps = {
  id: string;
  icon: string;
  label: string;
  target: CalendarDate | undefined;
};

const DateSuggestion: React.FC<DateSuggestionProps> = ({ id, icon, label, target }) => {
  const dayOfWeek = target !== undefined ? weekdayFormatter.format(target.toDate(timezone())) : "";

  return (
    <MenuItem id={id} aria-label={label}>
      <div className="date-suggestion-elem">
        <div className="date-suggestion-label">
          <ObsidianIcon id={icon} size="s" />
          {label}
        </div>
        <div className="date-suggestion-day">{dayOfWeek}</div>
      </div>
    </MenuItem>
  );
};

const getSuggestions = (): DateSuggestionProps[] => {
  const dateI18n = t().dates;
  const selectorI18n = t().createTaskModal.dateSelector;

  const startOfNextWeek = endOfWeek(todayInZone(), "en-US").add({
    days: 1,
  });
  const suggestions = [
    {
      id: "today",
      icon: "calendar",
      label: dateI18n.today,
      target: todayInZone(),
    },
    {
      id: "tomorrow",
      icon: "sun",
      label: dateI18n.tomorrow,
      target: todayInZone().add({ days: 1 }),
    },
    {
      id: "next-week",
      icon: "calendar-clock",
      label: dateI18n.nextWeek,
      target: startOfNextWeek,
    },
    {
      id: "no-date",
      icon: "ban",
      label: selectorI18n.noDate,
      target: undefined,
    },
  ];

  return suggestions;
};

type TimeDialogProps = {
  selectedTimeInfo: DueDate["timeInfo"] | undefined;
  setTimeInfo: (timeInfo: DueDate["timeInfo"] | undefined) => void;
};

const TimeDialog: React.FC<TimeDialogProps> = ({ selectedTimeInfo, setTimeInfo }) => {
  const i18n = t().createTaskModal.dateSelector.timeDialog;

  const [taskTimeInfo, setTaskTimeInfo] = useState(selectedTimeInfo);

  const onTimeChange = (time: Time | null) => {
    if (time === null) {
      return;
    }

    setTaskTimeInfo({ time });
  };

  return (
    <Dialog className="task-option-dialog task-time-menu" aria-label="Time selector">
      {({ close }) => (
        <>
          <TimeField
            className="task-time-picker"
            value={taskTimeInfo?.time ?? null}
            onChange={onTimeChange}
          >
            <Label className="task-time-picker-label">{i18n.timeLabel}</Label>
            <DateInput className="task-time-picker-input">
              {(segment) => (
                <DateSegment className="task-time-picker-input-segment" segment={segment} />
              )}
            </DateInput>
          </TimeField>
          <div className="task-time-controls">
            <Button onPress={close}>{i18n.cancelButtonLabel}</Button>
            <Button
              className="mod-cta"
              onPress={() => {
                close();
                setTimeInfo(taskTimeInfo);
              }}
            >
              {i18n.saveButtonLabel}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
};
