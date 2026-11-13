import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../../components/Typography';
import { endpoints, type LearningItemSummary } from '../../api';
import { Async, Badge, Card, ErrorState, IconCircle, Ionicons, Muted, ProgressBar, Row, Screen, Segmented, type IconName } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import type { StudentTabScreen } from '../../navigation/types';
import { colors, fontSizes, radii, spacing, TOUCH } from '../../theme';
import { subjectIcon } from './StudentHomeScreen';

export default function LearnScreen({ navigation, route }: StudentTabScreen<'Learn'>) {
  const [view, setView] = useState<'mine' | 'all'>('all');
  const [subjectId, setSubjectId] = useState<string | undefined>(route.params?.subjectId);
  const subjects = useApi(endpoints.learningSubjects, [], { reloadOnFocus: true });
  const cont = useApi(endpoints.continueLearning, [], { reloadOnFocus: true });
  const items = useApi(() => endpoints.learningItems(view, subjectId), [view, subjectId], { reloadOnFocus: true });

  const { width, fontScale } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const contentWidth = measuredWidth ?? Math.min(1120, Math.max(0, width - spacing.lg * 2));
  const scale = Math.max(1, fontScale);
  const subjectColumns = contentWidth >= 1040 * scale ? 4 : contentWidth >= 740 * scale ? 3 : contentWidth >= 340 * scale ? 2 : 1;
  const subjectWidth = Math.max(0, (contentWidth - spacing.sm * (subjectColumns - 1)) / subjectColumns);
  const continueColumns = contentWidth >= 640 * scale ? 2 : 1;
  const continueWidth = Math.max(0, (contentWidth - spacing.md * (continueColumns - 1)) / continueColumns);
  const stackedRows = contentWidth < 300 * scale;
  const totalItems = subjects.data?.reduce((sum, s) => sum + s.totalItems, 0);
  const completedItems = subjects.data?.reduce((sum, s) => sum + s.completedItems, 0);
  const overallProgress = totalItems != null && completedItems != null
    ? totalItems > 0 ? Math.round(completedItems / totalItems * 100) : 0
    : undefined;

  useEffect(() => {
    if (route.params?.subjectId) setSubjectId(route.params.subjectId);
  }, [route.params?.subjectId]);

  const refresh = () => {
    void subjects.refresh();
    void cont.refresh();
    return items.refresh();
  };
  const open = (i: LearningItemSummary) => navigation.navigate('LearningItem', { id: i._id, title: i.title });

  return (
    <Screen refreshing={items.refreshing} onRefresh={refresh} style={styles.screen}>
      <View style={styles.content} onLayout={({ nativeEvent }) => setMeasuredWidth(nativeEvent.layout.width)}>
        <View style={[styles.heading, stackedRows && styles.stackedRow]}>
          <IconCircle icon="bulb-outline" bg={colors.mangoYellow} size={48} />
          <View style={[styles.copy, stackedRows && styles.stackedCopy]}>
            <Text variant="display" accessibilityRole="header" style={styles.title}>Learn</Text>
            <Text variant="body" style={styles.subtitle}>Explore a little. Discover a lot.</Text>
          </View>
        </View>

        {cont.error ? <ErrorState compact error={cont.error} onRetry={cont.retry} /> : null}
        {cont.data && cont.data.length > 0 ? (
          <View style={styles.section}>
            <Text variant="display" accessibilityRole="header" style={styles.sectionTitle}>Continue learning</Text>
            <Muted style={styles.sectionNote}>Pick up where you left off.</Muted>
            <View style={styles.continueGrid}>
              {cont.data.slice(0, 2).map((i) => (
                <Card key={i._id} onPress={() => open(i)} accessibilityLabel={`Continue ${i.title}`} style={[styles.continueCard, { width: continueWidth }]}>
                  <Row style={[styles.itemHeading, stackedRows && styles.stackedRow]} gap={spacing.md}>
                    <IconCircle icon={subjectIcon(i.subjectId?.icon)} bg={colors.white} size={36} />
                    <View style={[styles.copy, stackedRows && styles.stackedCopy]}>
                      {i.subjectId?.name ? <Text variant="body" style={styles.subjectName}>{i.subjectId.name}</Text> : null}
                      <Text variant="display" style={styles.itemTitle}>{i.title}</Text>
                    </View>
                  </Row>
                  <Row style={styles.badges} gap={spacing.xs}>
                    <Badge label={i.type} tone="muted" />
                    {i.estimatedMinutes ? <Badge label={`${i.estimatedMinutes} min`} tone="info" icon="time-outline" /> : null}
                    {i.quizId ? <Badge label="Quiz" tone="yellow" icon="help-circle" /> : null}
                  </Row>
                  <View style={styles.continueFooter}>
                    <Row style={styles.progressLabels}>
                      <Text variant="body" style={styles.resumeLabel}>Continue lesson</Text>
                      {i.progress ? <Text variant="body" style={styles.progressText}>{i.progress.progressPct}% complete</Text> : null}
                    </Row>
                    <ProgressBar value={i.progress?.progressPct ?? 0} color={colors.forestGreen} height={6} />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Segmented
            options={[
              { value: 'all', label: 'All Learning' },
              { value: 'mine', label: 'My Subjects' },
            ]}
            value={view}
            onChange={setView}
          />
          {view === 'mine' ? <Muted style={styles.mineHelper}>Items you’ve already started or completed.</Muted> : null}
          <Text variant="display" accessibilityRole="header" style={styles.sectionTitle}>Explore subjects</Text>
          <Muted style={styles.sectionNote}>Filter your lessons. Subject progress covers all lessons.</Muted>
          {subjects.error ? <ErrorState compact error={subjects.error} onRetry={subjects.retry} /> : null}
          {subjects.loading && !subjects.data ? <Muted style={styles.sectionNote}>Loading subjects…</Muted> : null}
          <View style={styles.subjectGrid}>
            <SubjectFilterCard
              name="All subjects"
              icon="library-outline"
              selected={!subjectId}
              onPress={() => setSubjectId(undefined)}
              width={subjectWidth}
              totalItems={totalItems}
              completedItems={completedItems}
              progressPercent={overallProgress}
            />
            {(subjects.data ?? []).map((s) => (
              <SubjectFilterCard
                key={s._id}
                name={s.name}
                icon={subjectIcon(s.icon)}
                selected={subjectId === s._id}
                onPress={() => setSubjectId(s._id)}
                width={subjectWidth}
                totalItems={s.totalItems}
                completedItems={s.completedItems}
                progressPercent={s.progressPercent}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="display" accessibilityRole="header" style={styles.sectionTitle}>Lessons</Text>
          <Muted style={styles.sectionNote}>{view === 'mine' ? 'Your started and completed lessons.' : 'Find something new to learn.'}</Muted>
          <Async
            state={items}
            isEmpty={(d) => d.items.length === 0}
            empty={{
              icon: 'library-outline',
              title: view === 'mine' ? 'Nothing started yet' : 'No learning items here',
              message: view === 'mine' ? 'Open something from All Learning to start.' : 'Try another subject.',
            }}
          >
            {(d) => d.items.map((i) => (
              <Card key={i._id} onPress={() => open(i)} accessibilityLabel={i.title} style={styles.lessonCard}>
                <Row style={[styles.itemHeading, stackedRows && styles.stackedRow]} gap={spacing.md}>
                  <IconCircle icon={subjectIcon(i.subjectId?.icon)} size={36} />
                  <View style={[styles.copy, stackedRows && styles.stackedCopy]}>
                    <Text variant="display" style={styles.itemTitle}>{i.title}</Text>
                    {i.description ? <Muted numberOfLines={2} style={styles.description}>{i.description}</Muted> : null}
                  </View>
                  {!stackedRows ? <Ionicons name="chevron-forward" size={18} color={colors.forestGreen} style={styles.chevron} /> : null}
                </Row>
                <Row style={styles.badges} gap={spacing.xs}>
                  {i.subjectId?.name ? <Text variant="body" style={styles.subjectBadge}>{i.subjectId.name}</Text> : null}
                  <Badge label={i.type} tone="muted" />
                  {i.estimatedMinutes ? <Badge label={`${i.estimatedMinutes} min`} tone="info" icon="time-outline" /> : null}
                  {i.quizId ? <Badge label="Quiz" tone="yellow" icon="help-circle" /> : null}
                  {i.progress?.status === 'completed' ? <Badge label="Completed" tone="success" icon="checkmark" /> : null}
                </Row>
                {i.progress ? (
                  <View style={styles.lessonProgress}>
                    <Text variant="body" style={styles.progressText}>{i.progress.progressPct}% complete</Text>
                    <ProgressBar value={i.progress.progressPct} height={6} />
                  </View>
                ) : null}
              </Card>
            ))}
          </Async>
        </View>
      </View>
    </Screen>
  );
}

function SubjectFilterCard({ name, icon, selected, onPress, width, totalItems, completedItems, progressPercent }: {
  name: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
  width: number;
  totalItems?: number;
  completedItems?: number;
  progressPercent?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${name}${totalItems != null && completedItems != null ? `. ${totalItems} lessons, ${completedItems} completed` : ''}${progressPercent != null ? `. ${progressPercent}% complete` : ''}`}
      style={({ pressed }) => [styles.subjectCard, { width }, selected && styles.subjectSelected, pressed && styles.pressed]}
    >
      <Row style={styles.subjectIcons}>
        <IconCircle icon={icon} size={32} bg={selected ? colors.mangoYellow : colors.lightGreen} />
        <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? colors.forestGreen : colors.locked} />
      </Row>
      <Text variant="display" style={styles.subjectTitle}>{name}</Text>
      {totalItems != null && completedItems != null ? (
        <Row style={styles.subjectMetrics} gap={spacing.xs}>
          <Text variant="body" style={styles.metricText}>{totalItems} {totalItems === 1 ? 'lesson' : 'lessons'}</Text>
          <Text variant="body" style={styles.metricText}>{completedItems} completed</Text>
        </Row>
      ) : <Muted>Browse every subject</Muted>}
      {progressPercent != null ? (
        <View style={styles.subjectProgress}>
          <Text variant="body" style={styles.progressText}>{progressPercent}% complete</Text>
          <ProgressBar value={progressPercent} height={5} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.warmIvory },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center' },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGreen,
    borderLeftWidth: 4,
    borderLeftColor: colors.mangoYellow,
    borderRadius: radii.lg,
  },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.forestGreen, fontSize: fontSizes.xxl, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: fontSizes.sm, lineHeight: 21, marginTop: spacing.xs },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.forestGreen, fontSize: fontSizes.lg, fontWeight: '800' },
  sectionNote: { marginTop: spacing.xs, marginBottom: spacing.md },
  continueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'stretch' },
  continueCard: { marginBottom: 0, padding: spacing.md, backgroundColor: colors.goldBg, borderColor: colors.mangoYellow },
  itemHeading: { alignItems: 'flex-start' },
  itemTitle: { color: colors.text, fontSize: fontSizes.md, fontWeight: '800' },
  subjectName: { color: colors.forestGreen, fontSize: fontSizes.xs, fontWeight: '600', marginBottom: spacing.xs },
  badges: { flexWrap: 'wrap', alignItems: 'flex-start', marginTop: spacing.sm },
  continueFooter: { marginTop: spacing.md, paddingTop: spacing.sm, flexGrow: 1, justifyContent: 'flex-end', gap: spacing.sm },
  progressLabels: { flexWrap: 'wrap', justifyContent: 'space-between' },
  resumeLabel: { color: colors.forestGreen, fontSize: fontSizes.xs, fontWeight: '700' },
  progressText: { color: colors.forestGreen, fontSize: fontSizes.xs, fontWeight: '600' },
  mineHelper: { marginBottom: spacing.md },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'stretch' },
  subjectCard: {
    minHeight: TOUCH,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectSelected: { backgroundColor: colors.lightGreen, borderColor: colors.forestGreen },
  subjectIcons: { justifyContent: 'space-between' },
  subjectTitle: { color: colors.forestGreen, fontSize: fontSizes.md, fontWeight: '800' },
  subjectMetrics: { flexWrap: 'wrap', justifyContent: 'space-between' },
  metricText: { color: colors.textMuted, fontSize: fontSizes.xs },
  subjectProgress: { marginTop: 'auto', paddingTop: spacing.xs, gap: spacing.sm },
  pressed: { opacity: 0.75 },
  lessonCard: { padding: spacing.md, marginBottom: spacing.sm },
  description: { marginTop: spacing.xs },
  chevron: { marginTop: spacing.xs },
  subjectBadge: {
    maxWidth: '100%',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.lightGreen,
    color: colors.forestGreen,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  lessonProgress: { marginTop: spacing.sm, gap: spacing.xs },
  stackedRow: { flexDirection: 'column', alignItems: 'stretch' },
  stackedCopy: { flex: 0 },
});
