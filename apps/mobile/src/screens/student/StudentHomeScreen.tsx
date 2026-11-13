import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../../components/Typography';
import { endpoints, type StudentActivity } from '../../api';
import { Async, Badge, Button, Card, IconCircle, Ionicons, Muted, ProgressBar, Row, Screen, SectionTitle, type IconName } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import type { StudentTabScreen } from '../../navigation/types';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { avatarEmoji, fmtDateTime, fmtPercent } from '../../utils/format';

export const SUBJECT_ICONS: Record<string, IconName> = {
  'book-open': 'book-outline',
  calculator: 'calculator-outline',
  flask: 'flask-outline',
  cpu: 'hardware-chip-outline',
  trophy: 'trophy-outline',
  globe: 'globe-outline',
};
export const subjectIcon = (icon?: string): IconName => (icon && SUBJECT_ICONS[icon]) || 'book-outline';

export default function StudentHomeScreen({ navigation }: StudentTabScreen<'Home'>) {
  const state = useApi(endpoints.studentHome, [], { reloadOnFocus: true });
  const progress = useApi(() => endpoints.studentProgress('all'), [], { reloadOnFocus: true });
  const activities = useApi(() => endpoints.studentActivities('pending'), [], { reloadOnFocus: true });
  const { width, fontScale } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  // The tablet navigation shell can take up window space; use the actual content width.
  const contentWidth = measuredWidth ?? Math.min(1120, Math.max(0, width - spacing.lg * 2));
  const scale = Math.max(1, fontScale);
  const quickColumns = contentWidth >= 900 * scale ? 5 : contentWidth >= 340 * scale ? 2 : 1;
  const quickWidth = (contentWidth - spacing.sm * (quickColumns - 1)) / quickColumns;
  const widePanels = contentWidth >= 800 * scale;
  const wideHero = contentWidth >= 1000;
  const subjectColumns = contentWidth >= 900 * scale ? 4 : contentWidth >= 340 * scale ? 2 : 1;
  const subjectWidth = (contentWidth - spacing.sm * (subjectColumns - 1)) / subjectColumns;
  const quick: Array<{ label: string; description: string; icon: IconName; background: string; color: string; onPress: () => void }> = [
    { label: 'My Activities', description: 'Continue where you left off', icon: 'book-outline', background: '#E6F0E4', color: colors.forestGreen, onPress: () => navigation.navigate('MyActivities') },
    { label: 'Learn', description: 'Explore new concepts', icon: 'bulb-outline', background: '#FFF3CD', color: '#FFB900', onPress: () => navigation.navigate('Learn') },
    { label: 'Games', description: 'Play & Learn', icon: 'game-controller-outline', background: '#E0F0DF', color: colors.forestGreen, onPress: () => navigation.navigate('Games') },
    { label: 'Certificates', description: 'Earn your rewards', icon: 'ribbon-outline', background: '#F0E6F8', color: '#7441C0', onPress: () => navigation.navigate('Certificates') },
    { label: 'My Progress', description: 'Track your growth', icon: 'stats-chart-outline', background: '#FFDFDF', color: '#F04447', onPress: () => navigation.navigate('Progress') },
  ];

  async function refreshHome() {
    await Promise.all([state.refresh(), progress.refresh(), activities.refresh()]);
  }

  function openActivity(a: StudentActivity) {
    if (a.type === 'quiz' && a.quizId && !a.completed && a.status !== 'closed') {
      navigation.navigate('Quiz', { kind: 'quiz', quizId: a.quizId._id, activityId: a._id, title: a.title });
    } else {
      navigation.navigate('MyActivities');
    }
  }

  return (
    <Screen refreshing={state.refreshing || progress.refreshing || activities.refreshing} onRefresh={refreshHome} style={styles.screen}>
      <View style={styles.content} onLayout={({ nativeEvent }) => setMeasuredWidth(nativeEvent.layout.width)}>
        <Async state={state} loadingLabel="Getting your day ready…">
          {(h) => {
            const dp = h.dailyProgress;
            const doneToday = dp.quizzes + dp.learningItems + dp.games;
            const goalPct = Math.min(100, (doneToday / Math.max(1, dp.dailyGoal)) * 100);
            const totalLearning = h.subjects.reduce((sum, s) => sum + s.totalItems, 0);
            const completedLearning = h.subjects.reduce((sum, s) => sum + s.completedItems, 0);
            const learningPercent = totalLearning > 0 ? (completedLearning / totalLearning) * 100 : null;
            return (
              <>
                <View style={[styles.hero, wideHero && { minHeight: Math.max(260, contentWidth * 272 / 1337) }]}>
                  <View style={[styles.heroCopy, wideHero && styles.heroCopyWide]}>
                    <Text variant="display" accessibilityRole="header" style={[styles.heroTitle, wideHero && styles.heroTitleWide]}>
                      {'Dream Big,\n'}<Text variant="display" style={styles.heroYellow}>Learn More!</Text>
                    </Text>
                    <Text style={styles.heroSubtitle}>Explore • Learn • Grow</Text>
                    <Button title="Start Learning" variant="accent" icon="arrow-forward" onPress={() => navigation.navigate('Learn')} style={styles.heroButton} />
                  </View>
                  {wideHero ? (
                    <Image source={require('../../../assets/student-home/hero-scene.png')} resizeMode="contain" accessible={false} style={styles.heroWideArt} />
                  ) : (
                    <View style={styles.heroArt}>
                      <Image source={require('../../../assets/student-home/student-scene.png')} resizeMode="contain" accessible={false} style={{ width: contentWidth / 2, height: contentWidth / 2 * 272 / 360 }} />
                      <Image source={require('../../../assets/student-home/trophy-scene.png')} resizeMode="contain" accessible={false} style={{ width: contentWidth / 2, height: contentWidth / 2 * 272 / 561 }} />
                    </View>
                  )}
                </View>

                <View style={styles.quickGrid}>
                  {quick.map((q) => (
                    <Pressable
                      key={q.label}
                      onPress={q.onPress}
                      accessibilityRole="button"
                      accessibilityLabel={`${q.label}. ${q.description}`}
                      style={({ pressed }) => [styles.quick, { width: quickWidth, backgroundColor: q.background }, pressed && styles.pressed]}
                    >
                      <View style={styles.quickIcon}><Ionicons name={q.icon} size={30} color={q.color} /></View>
                      <Text variant="display" style={styles.quickTitle}>{q.label}</Text>
                      <Text style={styles.quickDescription}>{q.description}</Text>
                      <Ionicons name="arrow-forward" size={18} color={q.color} />
                    </Pressable>
                  ))}
                </View>

                <View style={[styles.panels, widePanels && styles.panelsWide]}>
                  <Card style={[styles.panel, widePanels && styles.panelWide]}>
                    <View style={styles.panelHeading}>
                      <Text variant="display" accessibilityRole="header" style={styles.panelTitle}>Your Learning Progress</Text>
                      <Button title="View Details" variant="ghost" small onPress={() => navigation.navigate('Progress')} />
                    </View>
                    <Async state={progress} loadingLabel="Loading your learning progress…">
                      {(p) => (
                        <>
                          <View style={[styles.progressContent, contentWidth >= 440 * scale && styles.progressContentWide]}>
                            <View style={styles.ringColumn}>
                              <ProgressRing value={p.overall.averagePercent} />
                              <Text style={styles.ringExplanation}>All-time quiz and assessment score</Text>
                            </View>
                            <View style={styles.metrics}>
                              <Metric label="Activities" value={p.activityCompletion.ratePercent} color={colors.forestGreen} explanation="Assigned activity completion" />
                              <Metric label="Quizzes" value={p.overall.quizAccuracyPercent} color={colors.mangoYellow} explanation="All-time quiz accuracy" />
                              <Metric label="Games" value={null} color="#6D97C4" explanation="Game progress percentage is not available" />
                              <Metric label="Learning" value={learningPercent} color="#B08BC1" explanation="Completed learning items across your subjects" />
                            </View>
                          </View>
                          <Muted style={styles.metricNote}>Activities show completion; quizzes show accuracy. Game progress is not available yet.</Muted>
                        </>
                      )}
                    </Async>
                    <View style={styles.encouragement}>
                      <Ionicons name="sparkles-outline" size={20} color={colors.forestGreen} />
                      <Text style={styles.encouragementText}>Excellent! Keep up the great work!</Text>
                    </View>
                  </Card>

                  <Card style={[styles.panel, widePanels && styles.panelWide]}>
                    <View style={styles.panelHeading}>
                      <Text variant="display" accessibilityRole="header" style={styles.panelTitle}>Upcoming Activities</Text>
                      <Button title="View All" variant="ghost" small onPress={() => navigation.navigate('MyActivities')} />
                    </View>
                    <Muted style={styles.activitiesIntro}>Your pending teacher activities, ordered by due date.</Muted>
                    <Async
                      state={activities}
                      loadingLabel="Loading your activities…"
                      isEmpty={(items) => items.length === 0}
                      empty={{ icon: 'happy-outline', title: 'All caught up!', message: 'You have no pending activities. Explore learning or play a game.' }}
                    >
                      {(items) => (
                        <View>
                          {[...items].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 4).map((a) => {
                            const canStartQuiz = a.type === 'quiz' && Boolean(a.quizId) && !a.completed && a.status !== 'closed';
                            return (
                              <View key={a._id} style={styles.activity}>
                                <Row style={{ alignItems: 'flex-start' }}>
                                  <IconCircle icon={a.type === 'quiz' ? 'help-circle-outline' : 'clipboard-outline'} bg={a.type === 'quiz' ? '#FFF0CF' : '#E8F0FC'} size={36} />
                                  <View style={{ flex: 1, gap: spacing.xs }}>
                                    <Text variant="display" style={styles.cardTitle}>{a.title}</Text>
                                    {a.subjectId?.name ? <Muted>{a.subjectId.name}</Muted> : null}
                                    <Text style={styles.due}>Due {fmtDateTime(a.dueAt)}</Text>
                                    <View style={styles.activityActions}>
                                      {a.overdue ? <Badge label="Overdue" tone="danger" /> : null}
                                      {a.status === 'closed' ? <Badge label="Closed" tone="muted" /> : !a.overdue ? <Badge label={a.type} tone="green" /> : null}
                                      <Button title={canStartQuiz ? 'Start quiz' : 'View activity'} variant="secondary" small onPress={() => openActivity(a)} />
                                    </View>
                                  </View>
                                </Row>
                              </View>
                            );
                          })}
                          {items.length > 4 ? <Button title={`View all ${items.length} pending activities`} variant="ghost" small onPress={() => navigation.navigate('MyActivities')} /> : null}
                        </View>
                      )}
                    </Async>
                  </Card>
                </View>

                <Card style={[styles.achievement, widePanels && styles.achievementWide]}>
                  <Image source={require('../../../assets/student-home/achievement-medal.png')} resizeMode="contain" accessible={false} style={styles.medal} />
                  <View style={[styles.achievementCopy, widePanels && styles.achievementCopyWide]}>
                    <Text variant="display" style={[styles.achievementTitle, widePanels && styles.leftAligned]}>You’re on the right track!</Text>
                    <Text style={[styles.achievementSubtitle, widePanels && styles.leftAligned]}>Keep learning and achieve more.</Text>
                  </View>
                  <Button title="View Progress" icon="arrow-forward" onPress={() => navigation.navigate('Progress')} />
                  <View accessible={false} pointerEvents="none" style={styles.achievementLandscape}><View style={styles.achievementHillLight} /><View style={styles.achievementHillDark} /></View>
                </Card>

                <View style={styles.supplemental}>
                  <Button title="News & GK" variant="secondary" icon="newspaper-outline" onPress={() => navigation.navigate('News')} style={styles.supplementalButton} />
                  <Button title="Programmes" variant="secondary" icon="rocket-outline" onPress={() => navigation.navigate('Programmes')} style={styles.supplementalButton} />
                </View>

                <SectionTitle>Your day</SectionTitle>
                <Card onPress={() => navigation.navigate('Profile')} accessibilityLabel="Open my profile" style={styles.profile}>
                  <View style={styles.avatar}><Text style={{ fontSize: 34 }}>{avatarEmoji(h.student.avatar)}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Muted>Welcome back,</Muted>
                    <Text variant="display" style={styles.name}>{h.student.displayName || h.student.name}</Text>
                    <Text style={styles.cls}>{h.student.className} · {h.student.schoolName}</Text>
                    <Text style={styles.cls}>ID: {h.student.studentCode}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={colors.forestGreen} />
                </Card>

                <View style={styles.miniGrid}>
                  <Card style={[styles.mini, { backgroundColor: '#FFF4CC' }]}>
                    <Ionicons name="flame" size={22} color="#E07B00" />
                    <Text variant="display" style={styles.miniValue}>{h.streak.current}</Text>
                    <Muted>day streak{h.streak.activeToday ? ' · active today' : ''}</Muted>
                  </Card>
                  <Card style={[styles.mini, { backgroundColor: colors.goldBg }]} onPress={() => navigation.navigate('Certificates')} accessibilityLabel="Certification level">
                    <Ionicons name="ribbon" size={22} color={colors.gold} />
                    <Text variant="display" style={styles.miniValue}>{h.certification.currentLevel ? `Level ${h.certification.currentLevel}` : 'Start'}</Text>
                    <Muted>{h.certification.currentLevel ? `${h.certification.certificates} certificate${h.certification.certificates === 1 ? '' : 's'}` : 'Get certified'}</Muted>
                  </Card>
                </View>

                <Card>
                  <View style={styles.panelHeading}>
                    <Text variant="display" style={styles.cardTitle}>Today’s progress</Text>
                    <Badge label={doneToday >= dp.dailyGoal ? 'Goal reached!' : `${doneToday}/${dp.dailyGoal}`} tone={doneToday >= dp.dailyGoal ? 'success' : 'yellow'} />
                  </View>
                  <ProgressBar value={goalPct} color={colors.mangoYellow} height={12} style={{ marginVertical: spacing.sm }} />
                  <Row style={{ justifyContent: 'space-around', flexWrap: 'wrap' }}>
                    <Stat icon="help-circle-outline" value={dp.quizzes} label="Quizzes" />
                    <Stat icon="book-outline" value={dp.learningItems} label="Learning" />
                    <Stat icon="game-controller-outline" value={dp.games} label="Games" />
                  </Row>
                </Card>

                {h.pendingActivities > 0 ? (
                  <Card onPress={() => navigation.navigate('MyActivities')} style={{ backgroundColor: colors.lightGreen }} accessibilityLabel="Open my activities">
                    <Row>
                      <IconCircle icon="clipboard" bg={colors.white} />
                      <View style={{ flex: 1 }}>
                        <Text variant="display" style={styles.cardTitle}>{h.pendingActivities} activit{h.pendingActivities === 1 ? 'y' : 'ies'} from your teacher</Text>
                        <Muted>Tap to see what’s due</Muted>
                      </View>
                      <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                    </Row>
                  </Card>
                ) : null}

                {h.continueLearning ? (
                  <Card onPress={() => navigation.navigate('LearningItem', { id: h.continueLearning!.id, title: h.continueLearning!.title })} accessibilityLabel={`Continue ${h.continueLearning.title}`}>
                    <Muted>Continue learning</Muted>
                    <Text variant="display" style={styles.cardTitle}>{h.continueLearning.title}</Text>
                    <Row style={{ marginTop: spacing.sm }}>
                      <ProgressBar value={h.continueLearning.progressPct} style={{ flex: 1 }} />
                      <Text style={{ fontWeight: '700', color: colors.primary }}>{Math.round(h.continueLearning.progressPct)}%</Text>
                    </Row>
                  </Card>
                ) : null}

                <SectionTitle>My subjects</SectionTitle>
                <View style={styles.subjectGrid}>
                  {h.subjects.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => navigation.navigate('Learn', { subjectId: s.id })}
                      accessibilityRole="button"
                      accessibilityLabel={`${s.name}, ${s.progressPercent} percent complete`}
                      style={({ pressed }) => [styles.subject, { width: subjectWidth }, pressed && styles.pressed]}
                    >
                      <IconCircle icon={subjectIcon(s.icon)} />
                      <Text variant="display" style={styles.subjectName} numberOfLines={2}>{s.name}</Text>
                      <ProgressBar value={s.progressPercent} height={8} />
                      <Muted style={{ fontSize: fontSizes.xs }}>{s.completedItems}/{s.totalItems} done</Muted>
                    </Pressable>
                  ))}
                </View>
                {h.subjects.length === 0 ? <Muted>No subjects are available for your class yet.</Muted> : null}
                <Button title="Explore all learning" variant="secondary" icon="library-outline" onPress={() => navigation.navigate('Learn')} style={{ marginTop: spacing.md }} />
              </>
            );
          }}
        </Async>
      </View>
    </Screen>
  );
}

function ProgressRing({ value }: { value: number | null }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.max(0, Math.min(100, value ?? 0));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Overall Progress. All-time quiz and assessment score"
      accessibilityValue={value === null ? { text: 'No scores yet' } : { min: 0, max: 100, now: percent, text: fmtPercent(value) }}
      style={styles.ring}
    >
      <Svg width={148} height={148}>
        <Circle cx={74} cy={74} r={radius} stroke={colors.lightGreen} strokeWidth={12} fill="none" />
        {value !== null && percent > 0 ? <Circle cx={74} cy={74} r={radius} stroke={colors.forestGreen} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - percent / 100)} rotation={-90} origin="74, 74" /> : null}
      </Svg>
      <View style={styles.ringCenter}>
        <Text variant="display" style={styles.ringValue}>{fmtPercent(value)}</Text>
        <Text style={styles.ringLabel}>Overall Progress</Text>
      </View>
    </View>
  );
}

function Metric({ label, value, color, explanation }: { label: string; value: number | null; color: string; explanation: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${fmtPercent(value)}. ${explanation}`} style={styles.metric}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{fmtPercent(value)}</Text>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text variant="display" style={styles.miniValue}>{value}</Text>
      <Muted>{label}</Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.warmIvory },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center' },
  pressed: { opacity: 0.75 },
  hero: { backgroundColor: colors.forestGreen, borderRadius: radii.lg, overflow: 'hidden', marginBottom: spacing.lg },
  heroCopy: { padding: spacing.xl, gap: spacing.md, alignItems: 'center', zIndex: 1 },
  heroCopyWide: { width: '45%', marginLeft: '23%', paddingHorizontal: 0 },
  heroWideArt: { position: 'absolute', width: '100%', height: '100%', bottom: 0 },
  heroTitle: { color: colors.white, fontSize: 36, fontWeight: '900', lineHeight: 42, letterSpacing: -0.6, textAlign: 'center' },
  heroTitleWide: { fontSize: 46, lineHeight: 52 },
  heroYellow: { color: colors.mangoYellow, fontWeight: '900' },
  heroSubtitle: { color: colors.white, fontSize: fontSizes.md, lineHeight: 24 },
  heroButton: { marginTop: spacing.xs, borderRadius: radii.pill },
  heroArt: { flexDirection: 'row', alignItems: 'flex-end' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg, alignItems: 'stretch' },
  quick: { borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm, minHeight: 176 },
  quickIcon: { width: 48, height: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
  quickTitle: { color: colors.forestGreenDark, fontSize: fontSizes.md, fontWeight: '800', lineHeight: 22 },
  quickDescription: { color: colors.text, fontSize: fontSizes.xs, lineHeight: 18, flexGrow: 1 },
  panels: { gap: spacing.md, marginBottom: spacing.md },
  panelsWide: { flexDirection: 'row', alignItems: 'stretch' },
  panel: { marginBottom: 0 },
  panelWide: { flex: 1, minWidth: 0 },
  panelHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, marginBottom: spacing.sm },
  panelTitle: { color: colors.forestGreenDark, fontSize: fontSizes.lg, fontWeight: '800', lineHeight: 26, flexGrow: 1, flexShrink: 1 },
  progressContent: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md },
  progressContentWide: { flexDirection: 'row' },
  ringColumn: { width: 160, alignItems: 'center', gap: spacing.sm },
  ring: { width: 148, height: 148, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', width: 118, alignItems: 'center', gap: spacing.xs },
  ringValue: { color: colors.forestGreen, fontSize: fontSizes.xxl, fontWeight: '900', lineHeight: 34 },
  ringLabel: { color: colors.textMuted, fontSize: fontSizes.xs, textAlign: 'center', lineHeight: 16 },
  ringExplanation: { color: colors.textMuted, fontSize: fontSizes.xs, lineHeight: 18, textAlign: 'center' },
  metrics: { flexGrow: 1, alignSelf: 'stretch', justifyContent: 'center', gap: spacing.md },
  metric: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: radii.pill },
  metricLabel: { flex: 1, color: colors.text, fontSize: fontSizes.sm, lineHeight: 20 },
  metricValue: { color: colors.forestGreenDark, fontSize: fontSizes.sm, fontWeight: '700', lineHeight: 20, textAlign: 'right', minWidth: 50 },
  metricNote: { fontSize: fontSizes.xs, lineHeight: 18, marginBottom: spacing.md },
  encouragement: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radii.md, backgroundColor: '#EDF4E4', padding: spacing.md, marginTop: spacing.sm },
  encouragementText: { flex: 1, color: colors.forestGreen, fontSize: fontSizes.sm, lineHeight: 20, fontWeight: '600' },
  activitiesIntro: { fontSize: fontSizes.xs, lineHeight: 18, marginBottom: spacing.sm },
  activity: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  due: { color: colors.textMuted, fontSize: fontSizes.xs, lineHeight: 18 },
  activityActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.xs },
  achievement: { backgroundColor: colors.goldBg, borderColor: '#EFDFB0', alignItems: 'center', gap: spacing.md, padding: spacing.xl, paddingBottom: spacing.xl + 18, overflow: 'hidden' },
  achievementLandscape: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 28 },
  achievementHillLight: { position: 'absolute', left: '-10%', bottom: -28, width: '120%', height: 52, borderRadius: 120, backgroundColor: '#ACD34B' },
  achievementHillDark: { position: 'absolute', right: '-10%', bottom: -38, width: '120%', height: 58, borderRadius: 120, backgroundColor: '#247C36' },
  achievementWide: { flexDirection: 'row', flexWrap: 'wrap' },
  medal: { width: 220, height: 220 * 167 / 345, maxWidth: '100%' },
  achievementCopy: { gap: spacing.sm },
  achievementCopyWide: { flex: 1, minWidth: 200 },
  achievementTitle: { color: colors.forestGreenDark, fontSize: fontSizes.xl, fontWeight: '900', lineHeight: 30, textAlign: 'center' },
  achievementSubtitle: { color: colors.textMuted, fontSize: fontSizes.sm, lineHeight: 22, textAlign: 'center' },
  leftAligned: { textAlign: 'left' },
  supplemental: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  supplementalButton: { flexGrow: 1, flexBasis: 150 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.mangoYellow, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.forestGreenDark, fontSize: fontSizes.xl, fontWeight: '900', lineHeight: 34, letterSpacing: -0.4 },
  cls: { color: colors.textMuted, fontSize: fontSizes.sm, lineHeight: 20, marginTop: 2 },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  mini: { flexGrow: 1, flexBasis: 140, marginBottom: 0, gap: 2 },
  miniValue: { fontSize: fontSizes.lg, fontWeight: '800', lineHeight: 26, color: colors.text },
  cardTitle: { fontSize: fontSizes.md, fontWeight: '800', lineHeight: 22, letterSpacing: -0.2, color: colors.text },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  subject: { backgroundColor: colors.white, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 6 },
  subjectName: { fontSize: fontSizes.md, fontWeight: '700', lineHeight: 22, color: colors.text, minHeight: 40 },
});
