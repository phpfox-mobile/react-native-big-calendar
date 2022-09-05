import React from 'react'
import { TextStyle, ViewStyle } from 'react-native'

import { MIN_HEIGHT } from '../commonStyles'
import {
  CalendarCellStyle,
  CalendarCellTextStyle,
  DateRangeHandler,
  EventCellStyle,
  EventRenderer,
  HeaderRenderer,
  ICalendarEventBase,
  Mode,
  MonthHeaderRenderer,
  WeekNum,
} from '../interfaces'
import { typedMemo } from '../utils'
import { CalendarBodyForMonthView, EventFormat } from './CalendarBodyForMonthView'
import { CalendarHeaderForMonthView } from './CalendarHeaderForMonthView'

export interface CalendarContainerProps<T extends ICalendarEventBase> {
  /**
   * Events to be rendered. This is a required prop.
   */
  events: EventFormat[]

  /**
   * The height of calendar component. This is a required prop.
   */
  height: number

  /**
   * The height of each hour row.
   */
  hourRowHeight?: number

  /**
   * Adjusts the indentation of events that occur during the same time period. Defaults to 20 on web and 8 on mobile.
   */
  overlapOffset?: number

  // Custom style
  eventCellStyle?: EventCellStyle<T>
  calendarCellStyle?: CalendarCellStyle
  calendarCellTextStyle?: CalendarCellTextStyle
  calendarContainerStyle?: ViewStyle
  headerContainerStyle?: ViewStyle
  headerContentStyle?: ViewStyle
  dayHeaderStyle?: ViewStyle
  dayHeaderHighlightColor?: string
  weekDayHeaderHighlightColor?: string
  bodyContainerStyle?: ViewStyle

  // Custom renderer
  renderEvent?: EventRenderer<T>
  renderHeader?: HeaderRenderer<T>
  renderHeaderForMonthView?: MonthHeaderRenderer

  ampm?: boolean
  targetDate?: Date
  locale?: string
  hideNowIndicator?: boolean
  showAdjacentMonths?: boolean
  mode?: Mode
  scrollOffsetMinutes?: number
  showTime?: boolean
  swipeEnabled?: boolean
  weekStartsOn?: WeekNum
  onChangeDate?: DateRangeHandler
  onPressCell?: (date: Date) => void
  onPressDateHeader?: (date: Date) => void
  onPressEvent?: (event: T) => void
  weekEndsOn?: WeekNum
  maxVisibleEventCount?: number
  eventMinHeightForMonthView?: number
  activeDate?: Date
  headerComponent?: React.ReactElement | null
  headerComponentStyle?: ViewStyle
  hourStyle?: TextStyle
  showAllDayEventCell?: boolean
  sortedMonthView?: boolean
  moreLabel?: string
  minCellHeight?: number
}

function _CalendarContainer<T extends ICalendarEventBase>({
  events,
  height,
  hourRowHeight,
  targetDate,
  eventCellStyle,
  calendarCellStyle,
  calendarCellTextStyle,
  locale = 'en',
  hideNowIndicator = false,
  mode = 'week',
  headerContainerStyle = {},
  headerContentStyle = {},
  dayHeaderStyle = {},
  dayHeaderHighlightColor = '',
  weekDayHeaderHighlightColor = '',
  bodyContainerStyle = {},
  weekStartsOn = 0,
  onPressCell,
  onPressDateHeader,
  onPressEvent,
  renderEvent,
  renderHeaderForMonthView: HeaderComponentForMonthView = CalendarHeaderForMonthView,
  maxVisibleEventCount,
  eventMinHeightForMonthView = 22,
  showAllDayEventCell = true,
  moreLabel = '{moreCount} More',
  showAdjacentMonths = true,
  sortedMonthView = true,
  minCellHeight = 100,
}: CalendarContainerProps<T>) {
  const cellHeight = React.useMemo(
    () => hourRowHeight || Math.max(height - 30, MIN_HEIGHT) / 24,
    [height, hourRowHeight],
  )

  const commonProps = {
    cellHeight,
    mode,
    onPressEvent,
  }

  const headerProps = {
    style: headerContainerStyle,
    locale: locale,
    weekStartsOn: weekStartsOn,
    headerContentStyle: headerContentStyle,
    dayHeaderStyle: dayHeaderStyle,
    dayHeaderHighlightColor: dayHeaderHighlightColor,
    weekDayHeaderHighlightColor: weekDayHeaderHighlightColor,
    showAllDayEventCell: showAllDayEventCell,
  }
  return (
    <React.Fragment>
      <HeaderComponentForMonthView {...headerProps} />
      <CalendarBodyForMonthView<T>
        {...commonProps}
        style={bodyContainerStyle}
        events={events}
        eventCellStyle={eventCellStyle}
        calendarCellStyle={calendarCellStyle}
        calendarCellTextStyle={calendarCellTextStyle}
        weekStartsOn={weekStartsOn}
        hideNowIndicator={hideNowIndicator}
        showAdjacentMonths={showAdjacentMonths}
        onPressCell={onPressCell}
        onPressDateHeader={onPressDateHeader}
        onPressEvent={onPressEvent}
        renderEvent={renderEvent}
        targetDate={targetDate ? targetDate : new Date()}
        maxVisibleEventCount={maxVisibleEventCount}
        eventMinHeightForMonthView={eventMinHeightForMonthView}
        sortedMonthView={sortedMonthView}
        moreLabel={moreLabel}
        minCellHeight={minCellHeight}
      />
    </React.Fragment>
  )
}

export const CalendarContainer = typedMemo(_CalendarContainer)
