import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#FFFFFF' },
  title: { fontSize: 28, marginBottom: 20, textAlign: 'center', color: '#2E7D32', fontWeight: 'bold' },
  subtitle: { fontSize: 18, marginBottom: 15, color: '#4CAF50', textAlign: 'left', fontWeight: 'bold' },
  text: { fontSize: 12, marginBottom: 8, color: '#1A1A1A', textAlign: 'left' },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#C8E6A8', marginBottom: 20 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#C8E6A8' },
  tableCol: { width: '25%', padding: 8, textAlign: 'center', fontSize: 10, color: '#1A1A1A' },
  tableHeader: { backgroundColor: '#E8F5D8', fontSize: 11, fontWeight: 'bold', color: '#2E7D32' },
  image: { marginVertical: 15, marginHorizontal: 0, borderRadius: 8 },
  footer: { marginTop: 20, fontSize: 10, color: '#4b5563', textAlign: 'center', lineHeight: 1.5 },
  footerLink: { color: '#2E7D32', textDecoration: 'none' }
})

interface StatisticsPDFProps {
  results: any
  dataType: 'ungrouped' | 'grouped'
  chartImages: {
    histogram?: string
    polygon?: string
    pie?: string
  }
}

export const StatisticsPDF = ({ results, dataType, chartImages }: StatisticsPDFProps) => {
  // Use rawStats for ungrouped if available, otherwise groupedStats
  const stats = dataType === 'ungrouped' && results.rawStats ? results.rawStats : results.groupedStats

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Comprehensive Statistical Report</Text>
        <Text style={styles.subtitle}>Date: {new Date().toLocaleDateString('en-US')}</Text>

        <Text style={styles.subtitle}>Basic Statistical Metrics</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCol, styles.tableHeader]}>Metric</Text>
            <Text style={[styles.tableCol, styles.tableHeader]}>Value</Text>
            <Text style={[styles.tableCol, styles.tableHeader]}>Metric</Text>
            <Text style={[styles.tableCol, styles.tableHeader]}>Value</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={[styles.tableCol, styles.tableHeader]}>Mean</Text>
            <Text style={styles.tableCol}>{stats.mean?.toFixed(2)}</Text>
            <Text style={[styles.tableCol, styles.tableHeader]}>Range</Text>
            <Text style={styles.tableCol}>{stats.range?.toFixed(2)}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCol, styles.tableHeader]}>Median</Text>
            <Text style={styles.tableCol}>{stats.median?.toFixed(2)}</Text>
            <Text style={[styles.tableCol, styles.tableHeader]}>Std Dev</Text>
            <Text style={styles.tableCol}>{stats.stdDev?.toFixed(2)}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCol, styles.tableHeader]}>Mode</Text>
            <Text style={styles.tableCol}>
              {Array.isArray(stats.mode) ? stats.mode.join(', ') : stats.mode?.toFixed(2)}
            </Text>
            <Text style={[styles.tableCol, styles.tableHeader]}>C.V.</Text>
            <Text style={styles.tableCol}>{stats.cv?.toFixed(2)}%</Text>
          </View>
        </View>

        {chartImages.histogram && (
          <>
            <Text style={styles.subtitle}>Histogram</Text>
            <Image style={styles.image} src={chartImages.histogram} />
          </>
        )}
        
        {chartImages.polygon && (
          <>
            <Text style={styles.subtitle}>Frequency Polygon</Text>
            <Image style={styles.image} src={chartImages.polygon} />
          </>
        )}

        {chartImages.pie && (
          <>
            <Text style={styles.subtitle}>Pie Chart</Text>
            <Image style={styles.image} src={chartImages.pie} />
          </>
        )}

        <View style={styles.footer}>
          <Text>Supervised by: Prof. Dr. Ahmed Elsawy</Text>
          <Text>Eng. Abdallah Henedy</Text>
          <Text>Built by: Eng. Ahmed Ragab</Text>
          <Text>https://www.facebook.com/ahmed.ragab.798225/</Text>
        </View>
      </Page>
    </Document>
  )
}
