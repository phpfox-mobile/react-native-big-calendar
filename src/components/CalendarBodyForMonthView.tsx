import { Calendar, CalendarDate } from 'calendar-base'
import * as React from 'react'
import { ScrollView, Text, TouchableOpacity, View, ViewStyle } from 'react-native'

import { u } from '../commonStyles'
import {
  CalendarCellStyle,
  CalendarCellTextStyle,
  EventRenderer,
  HorizontalDirection,
  ICalendarEventBase,
  WeekNum,
} from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { typedMemo } from '../utils'

export interface EventFormat {
  data: Record<string, any>
  start: CalendarDate
  end: CalendarDate
  isBetweenDay?: boolean
  isLastDay?: boolean
  isFirstDay?: boolean
  eventSlots?: EventFormat[] | false[]
}

export type CalendarDateOverride = {
  eventSlots?: EventFormat[] | false[]
} & CalendarDate

interface CalendarBodyForMonthViewProps<T extends ICalendarEventBase> {
  targetDate: Date
  events: EventFormat[]
  style: ViewStyle
  eventCellStyle?: ViewStyle
  calendarCellStyle?: CalendarCellStyle
  calendarCellTextStyle?: CalendarCellTextStyle
  hideNowIndicator?: boolean
  showAdjacentMonths: boolean
  onPressCell?: (date: any) => void
  onPressDateHeader?: (date: Date) => void
  onPressEvent?: (event: T) => void
  onSwipeHorizontal?: (d: HorizontalDirection) => void
  renderEvent?: EventRenderer<T>
  maxVisibleEventCount?: number
  weekStartsOn: WeekNum
  eventMinHeightForMonthView: number
  moreLabel: string
  sortedMonthView: boolean
  minCellHeight?: number
}

const createGroups = (arr: any[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size),
  )

function _CalendarBodyForMonthView<T extends ICalendarEventBase>({
  targetDate,
  style,
  onPressCell,
  events,
  onPressEvent,
  weekStartsOn = 1,
  eventMinHeightForMonthView = 25,
  minCellHeight,
  eventCellStyle,
  maxVisibleEventCount = 6,
}: CalendarBodyForMonthViewProps<T>) {
  const [calendarWidth, setCalendarWidth] = React.useState<number>(0)

  const calendar = React.useRef(
    new Calendar({ siblingMonths: true, weekStart: weekStartsOn }),
  ).current

  const nProps = React.useMemo(() => {
    return {
      month: targetDate.getMonth(),
      year: targetDate.getFullYear(),
    }
  }, [targetDate])

  //
  // console.log('nProps', targetDate, nProps, events)
  const days = React.useMemo(
    () =>
      calendar.getCalendar(nProps.year, nProps.month).map((day) => {
        let _day = { ...day, eventSlots: Array(maxVisibleEventCount - 1).fill(false) }
        return _day
      }),
    [calendar, maxVisibleEventCount, nProps.month, nProps.year],
  )

  const firstDayOfMonth = React.useMemo(() => days[0], [days]) as CalendarDate
  const lastDayOfMonth = React.useMemo(() => days[days.length - 1], [days]) as CalendarDate

  //
  const theme = useTheme()

  const getEventMeta = React.useCallback(
    (days, eventStart, eventEnd) => {
      const eventStartInView = calendar.isDateSelected(eventStart)
      const eventEndInView = calendar.isDateSelected(eventEnd)
      // console.log('eventStartInView-eventStartInView', eventStartInView, eventEndInView)
      const eventMeta = {
        // Asserts Event is visible in this month view
        isVisibleInView: false,
        visibleEventLength: days.length,
        // Returns the index (interval from first visible day) of [...days] of event's first "visible" day
        firstVisibleDayIndex: eventStartInView
          ? Calendar.interval(firstDayOfMonth, eventStart) - 1
          : 0,
      }

      // Asserts Event is visible in this month view
      if (eventStartInView || eventEndInView) {
        // Asserts event's first or last day is visible in this month view
        eventMeta.isVisibleInView = true
      } else if (eventStart.month < nProps.month && eventEnd.month > nProps.month) {
        // Asserts at least part of month is
        eventMeta.isVisibleInView = true
      }

      // Determine the visible length of the event during the month
      if (eventStartInView && eventEndInView) {
        eventMeta.visibleEventLength = Calendar.interval(eventStart, eventEnd)
      } else if (!eventStartInView && eventEndInView) {
        eventMeta.visibleEventLength = Calendar.interval(firstDayOfMonth, eventEnd)
      } else if (eventStartInView && !eventEndInView) {
        eventMeta.visibleEventLength = Calendar.interval(eventStart, lastDayOfMonth)
      }

      return eventMeta
    },
    [calendar, firstDayOfMonth, lastDayOfMonth, nProps.month],
  )
  //sort event day
  const sortEvents = (events: EventFormat[]): EventFormat[] => {
    return events.sort((eventA, eventB) => {
      if (eventA.start.year != eventB.start.year) {
        return eventA.start.year - eventB.start.year
      }
      if (eventA.start.month != eventB.start.month) {
        return eventA.start.month - eventB.start.month
      }
      return eventA.start.day - eventB.start.day
    })
  }

  const getDaysWithEvents = React.useCallback(() => {
    calendar.setStartDate(firstDayOfMonth)
    calendar.setEndDate(lastDayOfMonth)

    const days = calendar.getCalendar(nProps.year, nProps.month).map((day) => {
      let _day = { ...day, eventSlots: Array(maxVisibleEventCount - 1).fill(false) }
      return _day
    })

    if (!days) {
      return
    }
    // Set Range Limits on calendar

    const _events = sortEvents(events)
    // Iterate over each of the supplied events
    _events.forEach((eventItem) => {
      const eventMeta = getEventMeta(days, eventItem.start, eventItem.end)
      // console.log('eventMeta', _events, days, eventMeta, eventItem.start, eventItem.end)
      if (eventMeta.isVisibleInView) {
        const eventLength = eventMeta.visibleEventLength
        const eventSlotIndex = days[eventMeta.firstVisibleDayIndex]?.eventSlots.indexOf(false)
        let dayIndex = 0

        // For each day in the event
        while (dayIndex < eventLength) {
          // Clone the event object so we acn add day specfic data
          const eventData = Object.assign({}, eventItem)

          if (dayIndex === 0) {
            // Flag first day of event
            eventData.isFirstDay = true
          }

          if (dayIndex === eventLength - 1) {
            // Flag last day of event
            eventData.isLastDay = true
          }

          if (!eventData.isFirstDay || !eventData.isLastDay) {
            // Flag between day of event
            eventData.isBetweenDay = true
          }

          // Apply Event dayEvents to the correct slot for that day
          if (days[eventMeta.firstVisibleDayIndex + dayIndex]) {
            days[eventMeta.firstVisibleDayIndex + dayIndex].eventSlots[eventSlotIndex] = {
              ...eventData,
              eventLength,
              dayIndex: dayIndex,
            }
          }
          // Move to next day of event
          dayIndex++
        }
      }
    })

    return days
  }, [
    calendar,
    events,
    firstDayOfMonth,
    getEventMeta,
    lastDayOfMonth,
    maxVisibleEventCount,
    nProps.month,
    nProps.year,
  ])

  const state = React.useMemo(() => {
    return getDaysWithEvents()
  }, [getDaysWithEvents])

  const weeks = React.useMemo(() => createGroups(days ?? [], 7), [days])

  const lastIndexDisplayOnWeek = (data: EventFormat[]) => {
    let max = 0
    data.map((item) => {
      const slot = [...item.eventSlots]
      const slotEnd = slot?.reverse().findIndex((item) => item !== false)
      const index = slotEnd === -1 ? 0 : slot.length - slotEnd
      if (index > max) {
        max = index
      }
    })
    return max
  }

  const renderEventHoder = (item: any, index: number, maxIndexSlot: number) => {
    if (!item && index < maxIndexSlot) {
      return (
        <View
          key={index}
          style={[
            {
              height: eventMinHeightForMonthView,
              marginTop: 2,
            },
            eventCellStyle,
          ]}
        />
      )
    }
    if (!item) {
      return <View key={index} />
    }
    return (
      <View
        key={index}
        style={[
          {
            borderWidth: 1,
            borderColor: item.border_color,
            borderRadius: 2,
            backgroundColor: item.background_color,
            marginTop: 2,
            height: eventMinHeightForMonthView,
          },
          eventCellStyle,
        ]}
      ></View>
    )
  }

  const renderEvent = (event, indexEvent, weekDay) => {
    let widthText = 0
    let numday = 0
    if (event.isFirstDay) {
      numday = event.eventLength
    } else {
      numday = event.eventLength - event.dayIndex
    }
    widthText = (numday <= 7 ? numday : 7) * ((calendarWidth - 10) / 7)
    if (!event) {
      return (
        <View
          key={indexEvent}
          style={[
            {
              minHeight: eventMinHeightForMonthView,
              marginTop: 2,
            },
            eventCellStyle,
          ]}
        />
      )
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        key={indexEvent}
        onPress={() => onPressEvent(event)}
        style={[
          {
            minHeight: eventMinHeightForMonthView,
            backgroundColor: 'rgba(1,2,3,0)',
            marginTop: 2,
          },
          eventCellStyle,
        ]}
      >
        {event.isFirstDay || weekDay === 1 ? (
          <Text
            style={{
              width: widthText,
              paddingHorizontal: 5,
              minHeight: eventMinHeightForMonthView,
              fontWeight: 'bold',
              // borderWidth: 1,
            }}
            numberOfLines={1}
          >
            {event?.title}
          </Text>
        ) : null}
      </TouchableOpacity>
    )
  }

  const renderDay = (item: CalendarDate, index: number, maxIndexSlot: number) => {
    const dayData = state?.find((_item) => _item.day == item.day && _item.month == item.month)
    return (
      <TouchableOpacity
        key={index}
        style={[
          { borderColor: theme.palette.gray['200'] },
          {
            minHeight: minCellHeight,
            borderWidth: 1,
            width: (calendarWidth - 0) / 7,
            flexDirection: 'column',
          },
        ]}
      >
        <Text
          style={[
            { textAlign: 'center' },
            theme.typography.sm,
            {
              color: theme.palette.gray['800'],
            },
          ]}
        >
          {item.day}
        </Text>
        {dayData?.eventSlots?.map((item, index) => renderEventHoder(item, index, maxIndexSlot))}
      </TouchableOpacity>
    )
  }
  const renderDayEvents = (item: CalendarDate, index: number) => {
    const dayData = state?.find((_item) => _item.day == item.day && _item.month == item.month)
    // console.log('dayData222222', state, item.day, dayData)
    return (
      <TouchableOpacity
        key={index}
        onPress={() => onPressCell(item)}
        style={[
          u['p-2'],
          u['flex-1'],
          u['flex-column'],
          {
            minHeight: minCellHeight,
            marginHorizontal: 2,
          },
        ]}
      >
        <View style={{ height: 20 }}></View>
        {dayData?.eventSlots?.map((event, indexEvent) =>
          renderEvent(event, indexEvent, dayData.weekDay),
        )}
      </TouchableOpacity>
    )
  }
  const renderRow = (_items, index) => {
    let _weeks = createGroups(state ?? [], 7)
    const max = lastIndexDisplayOnWeek(_weeks[index])
    // console.log('maxIndexSlot', max, _weeks[index])
    return (
      <View key={index} style={{ flexDirection: 'row' }}>
        {_items.map((day, indexDay) => renderDay(day, indexDay, max))}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            flexDirection: 'row',
          }}
        >
          {_items.map((day, indexDay) => renderDayEvents(day, indexDay))}
        </View>
      </View>
    )
  }

  return (
    <View
      style={{
        margin: 10,
      }}
      onLayout={({ nativeEvent: { layout } }) => setCalendarWidth(layout.width)}
    >
      <ScrollView showsVerticalScrollIndicator={false}>{weeks.map(renderRow)}</ScrollView>
    </View>
  )
}

export const CalendarBodyForMonthView = typedMemo(_CalendarBodyForMonthView)
