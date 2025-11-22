'use client'

import { useState, useRef, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { calculateUngrouped, calculateGrouped, buildFrequencyTable, calculateKAuto } from '@/lib/calculations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import dynamic from 'next/dynamic'
import html2canvas from 'html2canvas'
import { StatisticsPDF } from '@/components/StatisticsPDF'

const PDFDownloadLink = dynamic(() => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink), {
  ssr: false,
  loading: () => <Button variant="outline">جاري تحميل الـ PDF...</Button>,
})

export default function Home() {
  const [dataType, setDataType] = useState<'ungrouped' | 'grouped'>('ungrouped')
  const [kValue, setKValue] = useState('')
  const [rawInput, setRawInput] = useState('')
  const [rawList, setRawList] = useState<number[]>([])
  const [editingIndex, setEditingIndex] = useState<-1 | number>(-1)
  const [groupLower, setGroupLower] = useState('')
  const [groupUpper, setGroupUpper] = useState('')
  const [groupFreq, setGroupFreq] = useState('')
  const [groupedRows, setGroupedRows] = useState<{ lower: number, upper: number, freq: number }[]>([])
  const [results, setResults] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const [chartImages, setChartImages] = useState<{ histogram?: string; polygon?: string; pie?: string }>({})
  const [isPdfReady, setIsPdfReady] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  
  const chartRefs = {
    histogram: useRef<HTMLDivElement>(null),
    polygon: useRef<HTMLDivElement>(null),
    pie: useRef<HTMLDivElement>(null)
  }



  const addToRawList = () => {
    const num = parseFloat(rawInput)
    if (isNaN(num)) return alert('Please enter a valid number')
    if (editingIndex >= 0) {
      const newList = [...rawList]
      newList[editingIndex] = num
      setRawList(newList)
      setEditingIndex(-1)
    } else {
      setRawList([...rawList, num])
    }
    setRawInput('')
  }

  const editRawItem = (index: number, value: number) => {
    setRawInput(value.toString())
    setEditingIndex(index)
    setRawList(rawList.filter((_, i) => i !== index))
  }

  const removeRawItem = (index: number) => {
    setRawList(rawList.filter((_, i) => i !== index))
  }

  const addRandomUngrouped = () => {
    const newNum = Math.floor(Math.random() * 101)
    setRawList([...rawList, newNum])
  }

  const addGroupRow = () => {
    const lower = parseFloat(groupLower)
    const upper = parseFloat(groupUpper)
    const freq = parseInt(groupFreq)
    if (isNaN(lower) || isNaN(upper) || isNaN(freq) || lower >= upper || freq <= 0) {
      return alert('Please enter valid values: Start < End, Frequency > 0')
    }
    setGroupedRows([...groupedRows, { lower, upper, freq }])
    setGroupLower('')
    setGroupUpper('')
    setGroupFreq('')
  }

  const removeGroupRow = (index: number) => {
    setGroupedRows(groupedRows.filter((_, i) => i !== index))
  }

  const addRandomGrouped = () => {
    const lower = Math.floor(Math.random() * 51)
    const width = Math.floor(Math.random() * 11) + 5
    const upper = lower + width
    const freq = Math.floor(Math.random() * 5) + 1
    setGroupedRows([...groupedRows, { lower, upper, freq }])
  }

  const handleCalculate = () => {
    if (dataType === 'ungrouped') {
      if (rawList.length === 0) return alert('Please enter data')
      const k = kValue ? parseInt(kValue) : calculateKAuto(rawList.length)
      const freqTable = buildFrequencyTable(rawList, k)
      const rawStats = calculateUngrouped(rawList)
      const groupedStats = calculateGrouped(freqTable)
      setResults({ rawStats, groupedStats, freqTable, k })
    } else {
      if (groupedRows.length === 0) return alert('Please enter rows')
      const inputTable = groupedRows.map(row => ({
        class: `${row.lower}-${row.upper}`,
        frequency: row.freq,
        midpoint: (row.lower + row.upper) / 2
      }))
      const groupedStats = calculateGrouped(inputTable)
      setResults({ groupedStats, freqTable: groupedStats.freqTable })
    }
    setShowResults(true)
  }

  const handleTabChange = (v: any) => {
    setDataType(v)
    setShowResults(false)
  }

  const COLORS = ['#2E7D32', '#4CAF50', '#8BC34A', '#9CCC65', '#C5E1A5', '#AED581']

  const isValidFreqTable = results?.freqTable && 
    (dataType === 'ungrouped' ? results.freqTable[0]?.midpoint !== undefined : results.freqTable[0]?.x !== undefined)

  const generatePdf = async () => {
    setIsGeneratingPdf(true)
    // Small delay to ensure rendering
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const images: any = {}
    const captureOptions = {
      scale: 2,
      backgroundColor: '#1f2937',
      onclone: (clonedDoc: Document) => {
        // Force remove any style attributes on the body/root that might contain oklch/lab variables
        const root = clonedDoc.documentElement;
        const body = clonedDoc.body;
        root.style.cssText = '';
        body.style.cssText = '';
        // Force simple colors
        root.style.backgroundColor = '#ffffff';
        body.style.backgroundColor = '#ffffff';
        body.style.color = '#000000';
      }
    }

    try {
      if (chartRefs.histogram.current) {
        const canvas = await html2canvas(chartRefs.histogram.current, captureOptions)
        images.histogram = canvas.toDataURL('image/png')
      }
      if (chartRefs.polygon.current) {
        const canvas = await html2canvas(chartRefs.polygon.current, captureOptions)
        images.polygon = canvas.toDataURL('image/png')
      }
      if (chartRefs.pie.current) {
        const canvas = await html2canvas(chartRefs.pie.current, captureOptions)
        images.pie = canvas.toDataURL('image/png')
      }
      setChartImages(images)
      setIsPdfReady(true)
    } catch (e) {
      console.error('Error capturing charts:', e)
      alert('Failed to generate charts for PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Reset PDF ready state when data changes
  useEffect(() => {
    setIsPdfReady(false)
    setChartImages({})
  }, [results, dataType])

  const renderEquation = (label: string, equation: string, value: string) => (
    <div className="group mb-3 p-4 bg-white/80 rounded-xl border-l-4 border-primary shadow-sm hover:shadow-md transition-all duration-300">
      <p className="font-bold text-base text-gray-800 mb-1">{label}</p>
      <p className="text-sm text-gray-600 font-mono mb-2 bg-gray-50 p-2 rounded border border-gray-100">{equation}</p>
      <p className="font-mono text-lg font-bold text-primary">{value}</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-background py-0">
      {/* Header Strip */}
      {/* Header Strip */}
      {/* Header Strip */}
      <div className="w-full bg-white/95 backdrop-blur-md border-b border-border py-4 mb-8 sticky top-0 z-50 shadow-[0_4px_20px_-10px_rgba(46,125,50,0.1)] transition-all duration-300">
        <div className="container mx-auto max-w-7xl px-4 flex justify-between items-center">
          <div className="flex items-center gap-4 group">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-3 rounded-2xl border border-primary/10 group-hover:scale-105 transition-transform duration-300 shadow-sm">
              <span className="text-2xl filter drop-shadow-sm">📊</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                Statistics Calculator
              </h1>
              <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                Professional Analysis Tool
              </p>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end text-right">
            <div className="bg-secondary/50 border border-secondary-foreground/10 px-3 py-1 rounded-full mb-1.5 shadow-sm">
              <p className="text-primary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span>🎓</span> Academic Supervision
              </p>
            </div>
            <p className="text-foreground text-sm font-bold tracking-tight">Prof. Dr. Ahmed Elsawy</p>
            <p className="text-muted-foreground text-xs font-medium">Eng. Abdallah Henedy</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 pb-24">
        
        {/* Main Input Card */}
        <Card className="shadow-lg border border-border bg-card mb-8 overflow-hidden">
          <Tabs value={dataType} onValueChange={handleTabChange} className="w-full relative">
            <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-t-xl">
              <TabsTrigger 
                value="ungrouped" 
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground font-bold transition-all duration-300 rounded-lg py-3"
              >
                📊 Ungrouped Data
              </TabsTrigger>
              <TabsTrigger 
                value="grouped" 
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground font-bold transition-all duration-300 rounded-lg py-3"
              >
                📈 Grouped Data
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ungrouped" className="mt-0 p-8 space-y-6 bg-white">
              <Card className="shadow-none border-0 bg-transparent">
                <CardHeader className="pb-4 border-b border-border px-0">
                  <CardTitle className="text-2xl font-bold text-foreground">Ungrouped Data Input</CardTitle>
                  <CardDescription className="text-muted-foreground text-base">Enter individual values and build your dataset</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 px-0">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label htmlFor="rawInput" className="text-sm font-semibold text-foreground mb-2 block">Enter Number</Label>
                      <Input 
                        id="rawInput"
                        value={rawInput} 
                        onChange={(e) => setRawInput(e.target.value)} 
                        placeholder="e.g., 175"
                        onKeyDown={(e) => e.key === 'Enter' && addToRawList()}
                        className="bg-white border-input text-foreground placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 text-lg"
                      />
                    </div>
                    <Button 
                      onClick={addToRawList} 
                      className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-12 px-8"
                    >
                      {editingIndex >= 0 ? '✓ Update' : '+ Add'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={addRandomUngrouped} 
                      className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 h-12 px-6"
                    >
                      🎲 Random
                    </Button>
                  </div>
                  
                  <div className="min-h-[200px] max-h-64 overflow-y-auto border border-border rounded-xl p-4 bg-secondary/20 shadow-inner">
                    {rawList.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {rawList.map((num, index) => (
                          <div key={index} className="group relative flex items-center justify-between p-3 bg-white rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-in fade-in zoom-in duration-300">
                            <Badge 
                              className="cursor-pointer bg-secondary text-secondary-foreground font-bold text-lg px-4 py-1.5 hover:bg-primary hover:text-white transition-colors rounded-lg w-full justify-center" 
                              onClick={() => editRawItem(index, num)}
                            >
                              {num}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeRawItem(index)}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:bg-destructive/90 p-0"
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-4">
                        <div className="bg-white p-4 rounded-full shadow-sm border border-border">
                          <span className="text-4xl grayscale opacity-50">🔢</span>
                        </div>
                        <div>
                          <p className="text-foreground font-semibold text-lg">Ready to analyze?</p>
                          <p className="text-muted-foreground text-sm">Add your first number to begin the magic!</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="k" className="text-sm font-semibold text-foreground mb-2 block">Number of Classes (K) - Optional</Label>
                    <Input 
                      id="k"
                      type="number" 
                      value={kValue} 
                      onChange={(e) => setKValue(e.target.value)} 
                      placeholder="Auto-calculated if left blank"
                      className="bg-white border-input text-foreground placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleCalculate} 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg h-14 rounded-xl"
                  >
                    🚀 Calculate Statistics
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grouped" className="mt-0 p-8 space-y-6 bg-white">
              <Card className="shadow-none border-0 bg-transparent">
                <CardHeader className="pb-4 border-b border-border px-0">
                  <CardTitle className="text-2xl font-bold text-foreground">Grouped Data Input</CardTitle>
                  <CardDescription className="text-muted-foreground text-base">Define class intervals with frequencies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 px-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-foreground mb-2 block">Class Start</Label>
                      <Input 
                        value={groupLower} 
                        onChange={(e) => setGroupLower(e.target.value)} 
                        placeholder="29" 
                        type="number"
                        className="bg-white border-input text-foreground placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 text-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground mb-2 block">Class End</Label>
                      <Input 
                        value={groupUpper} 
                        onChange={(e) => setGroupUpper(e.target.value)} 
                        placeholder="39" 
                        type="number"
                        className="bg-white border-input text-foreground placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 text-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground mb-2 block">Frequency</Label>
                      <Input 
                        value={groupFreq} 
                        onChange={(e) => setGroupFreq(e.target.value)} 
                        placeholder="5" 
                        type="number"
                        className="bg-white border-input text-foreground placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 text-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={addGroupRow} 
                      className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-md h-12 px-8"
                    >
                      ✓ Add Row
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={addRandomGrouped} 
                      className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 h-12 px-6"
                    >
                      🎲 Random
                    </Button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-gray-50">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-100">
                        <TableRow className="border-border">
                          <TableHead className="text-foreground font-bold">Class Interval</TableHead>
                          <TableHead className="text-foreground font-bold">Frequency</TableHead>
                          <TableHead className="text-foreground font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedRows.map((row, index) => (
                          <TableRow key={index} className="border-border hover:bg-muted/50 transition-colors">
                            <TableCell className="font-mono text-primary font-semibold">{row.lower} - {row.upper}</TableCell>
                            <TableCell className="text-foreground font-semibold">{row.freq}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeGroupRow(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                ✕ Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <Button 
                    onClick={handleCalculate} 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg h-14 rounded-xl"
                  >
                    🚀 Calculate Statistics
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Results Section */}
        {showResults && isValidFreqTable && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <Card className="shadow-lg border border-border bg-card overflow-hidden">
              <Tabs defaultValue="tables" className="w-full relative">
                <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-t-xl">
                  <TabsTrigger 
                    value="tables" 
                    className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground font-bold transition-all duration-300 rounded-lg py-2"
                  >
                    📋 Tables
                  </TabsTrigger>
                  <TabsTrigger 
                    value="summary" 
                    className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground font-bold transition-all duration-300 rounded-lg py-2"
                  >
                    📊 Summary
                  </TabsTrigger>
                  <TabsTrigger 
                    value="charts" 
                    className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground font-bold transition-all duration-300 rounded-lg py-2"
                  >
                    📈 Charts
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="tables" className="mt-0 p-8">
                  {dataType === 'ungrouped' && results?.freqTable && (
                    <Card className="shadow-lg border border-border bg-card overflow-hidden">
                      <CardHeader className="border-b border-border bg-muted/30">
                        <CardTitle className="text-2xl font-bold text-primary">📊 Frequency Distribution Table</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow className="border-border">
                                <TableHead className="text-primary font-bold">Classes</TableHead>
                                <TableHead className="text-primary font-bold">f</TableHead>
                                <TableHead className="text-primary font-bold">R.F (%)</TableHead>
                                <TableHead className="text-primary font-bold">X</TableHead>
                                <TableHead className="text-primary font-bold">Cum. Asc.</TableHead>
                                <TableHead className="text-primary font-bold">Cum. Desc.</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {results.freqTable.map((row: any, i: number) => (
                                <TableRow key={i} className="border-border hover:bg-muted/30 transition-colors">
                                  <TableCell className="font-mono text-foreground font-medium">{row.class}</TableCell>
                                  <TableCell className="text-foreground font-semibold">{row.frequency}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">{((row.frequency / results.freqTable.reduce((sum: number, r: any) => sum + r.frequency, 0)) * 100).toFixed(1)}%</TableCell>
                                  <TableCell className="text-right text-foreground">{row.midpoint}</TableCell>
                                  <TableCell className="text-right text-primary">{row.cumulativeAsc}</TableCell>
                                  <TableCell className="text-right text-secondary-foreground">{row.cumulativeDesc}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                                <TableCell className="text-primary">Total</TableCell>
                                <TableCell className="text-primary">{results.freqTable.reduce((sum: number, r: any) => sum + r.frequency, 0)}</TableCell>
                                <TableCell className="text-primary">100%</TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {dataType === 'grouped' && results?.freqTable && (
                    <Card className="shadow-lg border border-border bg-card overflow-hidden">
                      <CardHeader className="border-b border-border bg-muted/30">
                        <CardTitle className="text-2xl font-bold text-primary">📊 Complete Frequency Table</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow className="border-border">
                                <TableHead className="text-primary font-bold">Classes</TableHead>
                                <TableHead className="text-primary font-bold">Actual Bounds</TableHead>
                                <TableHead className="text-primary font-bold">x</TableHead>
                                <TableHead className="text-primary font-bold">f</TableHead>
                                <TableHead className="text-primary font-bold">R.F (%)</TableHead>
                                <TableHead className="text-primary font-bold">Cum. Asc.</TableHead>
                                <TableHead className="text-primary font-bold">Cum. Desc.</TableHead>
                                <TableHead className="text-primary font-bold">fx</TableHead>
                                <TableHead className="text-primary font-bold">(x - mean)</TableHead>
                                <TableHead className="text-primary font-bold">f(x - mean)²</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {results.freqTable.map((row: any, i: number) => (
                                <TableRow key={i} className="border-border hover:bg-muted/30 transition-colors">
                                  <TableCell className="font-mono text-foreground font-medium">{row.class}</TableCell>
                                  <TableCell className="font-mono text-muted-foreground">{row.actualBounds}</TableCell>
                                  <TableCell className="text-right text-foreground">{row.x?.toFixed(1) || 'N/A'}</TableCell>
                                  <TableCell className="text-right text-foreground font-semibold">{row.f}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">{row.rf?.toFixed(1) || 'N/A'}%</TableCell>
                                  <TableCell className="text-right text-primary">{row.cumulativeAsc}</TableCell>
                                  <TableCell className="text-right text-secondary-foreground">{row.cumulativeDesc}</TableCell>
                                  <TableCell className="text-right text-foreground">{row.fx?.toFixed(1) || 'N/A'}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">{row.deviation?.toFixed(1) || 'N/A'}</TableCell>
                                  <TableCell className="text-right text-foreground">{row.fDevSquared?.toFixed(1) || 'N/A'}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                                <TableCell className="text-primary">Total</TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-primary">{results.freqTable.reduce((sum: number, r: any) => sum + r.f, 0)}</TableCell>
                                <TableCell className="text-primary">100%</TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-primary">{(results.groupedStats.mean * results.freqTable.reduce((sum: number, r: any) => sum + r.f, 0)).toFixed(1)}</TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-primary">{(results.groupedStats.variance * (results.freqTable.reduce((sum: number, r: any) => sum + r.f, 0) - 1)).toFixed(1)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="summary" className="mt-0 p-8 space-y-6">
                  {dataType === 'ungrouped' && results && (
                    <>
                      <Card className="shadow-lg border border-border bg-card overflow-hidden">
                        <CardHeader className="border-b border-border bg-muted/30">
                          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                            <span>📊</span> Raw Data Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Primary Stat - Mean */}
                            <div className="md:col-span-2 lg:col-span-4 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 shadow-sm relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-8xl">📊</span>
                              </div>
                              <p className="text-primary font-bold text-lg mb-2 uppercase tracking-wider">Arithmetic Mean</p>
                              <p className="text-5xl font-black text-foreground font-mono tracking-tight">
                                {results.rawStats.mean?.toFixed(2)}
                              </p>
                            </div>

                            {[
                              { label: 'Median', value: results.rawStats.median?.toFixed(2), icon: '↔️' },
                              { label: 'Mode', value: Array.isArray(results.rawStats.mode) ? results.rawStats.mode.join(', ') : results.rawStats.mode, icon: '🎯' },
                              { label: 'Range', value: results.rawStats.range?.toFixed(2), icon: '📏' },
                              { label: 'Std Dev', value: results.rawStats.stdDev?.toFixed(2), icon: '📉' },
                              { label: 'Variance', value: results.rawStats.variance?.toFixed(2), icon: '⚡' },
                              { label: 'C.V.', value: `${results.rawStats.cv?.toFixed(2)}%`, icon: '📈' },
                              { label: 'Geometric Mean', value: results.rawStats.geometricMean?.toFixed(2), icon: '📐' }
                            ].map((stat, idx) => (
                              <div key={idx} className="p-5 rounded-xl bg-white border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 group">
                                <p className="text-muted-foreground text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                  <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{stat.icon}</span>
                                  {stat.label}
                                </p>
                                <p className="text-foreground text-2xl font-bold font-mono group-hover:text-primary transition-colors">{stat.value}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="shadow-lg border border-border bg-card">
                        <CardHeader className="border-b border-border">
                          <CardTitle className="text-2xl font-bold text-primary">📐 Grouped Data Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                          {renderEquation(
                            'Mean Deviation',
                            'M.D. = Σ|Xi - X̄| fi / n',
                            `= ${results.groupedStats.meanDev?.toFixed(2)}`
                          )}
                          {renderEquation(
                            'Variance',
                            'S² = Σ(Xi - X̄)² fi / (n-1)',
                            `= ${results.groupedStats.variance?.toFixed(2)}`
                          )}
                          {renderEquation(
                            'Standard Deviation',
                            'S = √Var',
                            `= ${results.groupedStats.stdDev?.toFixed(2)}`
                          )}
                          {renderEquation(
                            'Coefficient of Variation',
                            'C.V. = S / X̄',
                            `= ${results.groupedStats.cv?.toFixed(2)}%`
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            {[
                              { label: 'Mean', value: results.groupedStats.mean?.toFixed(2), icon: '📊' },
                              { label: 'Median', value: results.groupedStats.median?.toFixed(2), icon: '📈' },
                              { label: 'Mode', value: results.groupedStats.mode?.toFixed(2), icon: '🎯' },
                              { label: 'Range', value: results.groupedStats.range?.toFixed(2), icon: '📏' }
                            ].map((stat, idx) => (
                              <div key={idx} className="p-4 rounded-xl bg-green-50 border border-border hover:shadow-md transition-all duration-300">
                                <p className="text-muted-foreground text-sm font-semibold mb-1">{stat.icon} {stat.label}</p>
                                <p className="text-primary text-2xl font-bold">{stat.value}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                  {dataType === 'grouped' && results && (
                    <Card className="shadow-lg border border-border bg-card">
                      <CardHeader className="border-b border-border">
                        <CardTitle className="text-2xl font-bold text-primary">📊 Grouped Data Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-4">
                        {renderEquation(
                          'Mean Deviation',
                          'M.D. = Σ|Xi - X̄| fi / n',
                          `= ${results.groupedStats.meanDev?.toFixed(2)}`
                        )}
                        {renderEquation(
                          'Variance',
                          'S² = Σ(Xi - X̄)² fi / (n-1)',
                          `= ${results.groupedStats.variance?.toFixed(2)}`
                        )}
                        {renderEquation(
                          'Standard Deviation',
                          'S = √Var',
                          `= ${results.groupedStats.stdDev?.toFixed(2)}`
                        )}
                        {renderEquation(
                          'Coefficient of Variation',
                          'C.V. = S / X̄',
                          `= ${results.groupedStats.cv?.toFixed(2)}%`
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                          {/* Primary Stat - Mean */}
                          <div className="md:col-span-2 lg:col-span-3 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                              <span className="text-8xl">📊</span>
                            </div>
                            <p className="text-primary font-bold text-lg mb-2 uppercase tracking-wider">Arithmetic Mean</p>
                            <p className="text-5xl font-black text-foreground font-mono tracking-tight">
                              {results.groupedStats.mean?.toFixed(2)}
                            </p>
                          </div>

                          {[
                            { label: 'Median', value: results.groupedStats.median?.toFixed(2), icon: '↔️' },
                            { label: 'Mode', value: results.groupedStats.mode?.toFixed(2), icon: '🎯' },
                            { label: 'Range', value: results.groupedStats.range?.toFixed(2), icon: '📏' },
                            { label: 'Geometric Mean', value: results.groupedStats.geometricMean?.toFixed(2), icon: '📐' },
                            { label: 'Harmonic Mean', value: results.groupedStats.harmonicMean?.toFixed(2), icon: '📉' }
                          ].map((stat, idx) => (
                            <div key={idx} className="p-5 rounded-xl bg-white border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 group">
                              <p className="text-muted-foreground text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{stat.icon}</span>
                                {stat.label}
                              </p>
                              <p className="text-foreground text-2xl font-bold font-mono group-hover:text-primary transition-colors">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="charts" className="mt-0 p-8 space-y-8">
                  {isValidFreqTable && (
                    <>
                      <Card className="shadow-lg border border-border bg-card overflow-hidden">
                        <CardHeader className="border-b border-border bg-muted/30">
                          <CardTitle className="text-2xl font-bold text-primary">📊 Histogram</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="h-[450px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={results.freqTable}>
                                <defs>
                                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2E7D32" stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor="#4CAF50" stopOpacity={0.4}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="class" stroke="#4b5563" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                <YAxis stroke="#4b5563" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#ffffff', 
                                    border: '1px solid #C8E6A8',
                                    borderRadius: '8px',
                                    color: '#1A1A1A'
                                  }} 
                                />
                                <Legend wrapperStyle={{ color: '#1A1A1A' }} />
                                <Bar 
                                  dataKey={dataType === 'ungrouped' ? 'frequency' : 'f'} 
                                  fill="url(#barGradient)" 
                                  radius={[8, 8, 0, 0]}
                                  animationDuration={1000}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="shadow-lg border border-border bg-card overflow-hidden">
                        <CardHeader className="border-b border-border bg-muted/30">
                          <CardTitle className="text-2xl font-bold text-primary">📈 Frequency Polygon</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="h-[450px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={results.freqTable}>
                                <defs>
                                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#2E7D32"/>
                                    <stop offset="100%" stopColor="#8BC34A"/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                  dataKey={dataType === 'ungrouped' ? 'midpoint' : 'x'} 
                                  stroke="#4b5563" 
                                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <YAxis stroke="#4b5563" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#ffffff', 
                                    border: '1px solid #C8E6A8',
                                    borderRadius: '8px',
                                    color: '#1A1A1A'
                                  }} 
                                />
                                <Legend wrapperStyle={{ color: '#1A1A1A' }} />
                                <Line 
                                  type="monotone" 
                                  dataKey={dataType === 'ungrouped' ? 'frequency' : 'f'} 
                                  stroke="url(#lineGradient)" 
                                  strokeWidth={4} 
                                  dot={{ fill: '#2E7D32', strokeWidth: 3, r: 6 }} 
                                  activeDot={{ r: 8, fill: '#4CAF50' }}
                                  animationDuration={1000}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="shadow-lg border border-border bg-card overflow-hidden">
                        <CardHeader className="border-b border-border bg-muted/30">
                          <CardTitle className="text-2xl font-bold text-primary">🥧 Distribution Pie Chart</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="h-[500px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <defs>
                                  {COLORS.map((color, i) => (
                                    <linearGradient key={i} id={`pieGradient${i}`} x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stopColor={color} stopOpacity={1}/>
                                      <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
                                    </linearGradient>
                                  ))}
                                </defs>
                                <Pie
                                  data={results.freqTable.map((row: any) => ({ 
                                    name: row.class, 
                                    value: dataType === 'ungrouped' ? row.frequency : row.f 
                                  }))}
                                  cx="50%"
                                  cy="50%"
                                  labelLine
                                  outerRadius={120}
                                  innerRadius={60}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(1) : '0'}%`}
                                  animationDuration={1000}
                                >
                                  {results.freqTable.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={`url(#pieGradient${index % COLORS.length})`} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#ffffff', 
                                    border: '1px solid #C8E6A8',
                                    borderRadius: '8px',
                                    color: '#1A1A1A'
                                  }} 
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
            
            <div className="flex justify-center mt-8 mb-12">
              {!isPdfReady ? (
                <Button 
                  onClick={generatePdf}
                  disabled={isGeneratingPdf}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xl px-12 py-8 rounded-2xl shadow-lg flex items-center gap-4"
                >
                  {isGeneratingPdf ? 'Generating PDF...' : 'Generate PDF Report'}
                </Button>
              ) : (
                <PDFDownloadLink
                  document={<StatisticsPDF results={results} dataType={dataType} chartImages={chartImages} />}
                  fileName={`Statistics_Report_${new Date().toLocaleDateString('en-US').replace(/\//g, '-')}.pdf`}
                >
                  {({ loading, error }) =>
                    loading ? (
                      <Button className="bg-secondary text-secondary-foreground px-12 py-6 text-xl rounded-xl shadow-lg">
                        Preparing Download...
                      </Button>
                    ) : error ? (
                      <Button variant="destructive">Failed to generate PDF</Button>
                    ) : (
                      <Button className="bg-primary hover:bg-primary/90 text-white font-bold text-xl px-12 py-8 rounded-2xl shadow-lg flex items-center gap-4">
                        <span>Download PDF Report</span>
                      </Button>
                    )
                  }
                </PDFDownloadLink>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 border-t border-border pt-8 text-center text-sm text-gray-500">
          <p className="font-semibold text-primary mb-2">Supervised by: Prof. Dr. Ahmed Elsawy</p>
          <p className="mb-1">Eng. Abdallah Henedy</p>
          <p>
            Built by: <a href="https://www.facebook.com/ahmed.ragab.798225/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Eng. Ahmed Ragab</a>
          </p>
        </footer>

        {/* Hidden charts for PDF generation */}
        {showResults && isValidFreqTable && (
          <div 
            style={{ 
              position: 'fixed', 
              left: '-10000px', 
              top: 0, 
              width: '800px', 
              height: 'auto', 
              visibility: 'visible', 
              zIndex: -1,
              // Override all CSS variables that might use oklch/lab with safe hex values
              // @ts-ignore
              '--background': '#ffffff',
              '--foreground': '#0f172a',
              '--card': '#ffffff',
              '--card-foreground': '#0f172a',
              '--popover': '#ffffff',
              '--popover-foreground': '#0f172a',
              '--primary': '#2E7D32',
              '--primary-foreground': '#ffffff',
              '--secondary': '#8BC34A',
              '--secondary-foreground': '#0f172a',
              '--muted': '#E8F5D8',
              '--muted-foreground': '#4C8C2B',
              '--accent': '#9CCC65',
              '--accent-foreground': '#0f172a',
              '--destructive': '#ef4444',
              '--border': '#C8E6A8',
              '--input': '#C8E6A8',
              '--ring': '#2E7D32',
            }}
          >
            <div ref={chartRefs.histogram} style={{ width: 800, height: 450, background: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif', padding: 20, display: 'block' }}>
              <h2 style={{ color: '#2E7D32', textAlign: 'center', marginBottom: 10 }}>Histogram</h2>
              <BarChart width={760} height={400} data={results.freqTable}>
                <defs>
                  <linearGradient id="barGradientPDF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E7D32" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#4CAF50" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="class" stroke="#4b5563" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                <YAxis stroke="#4b5563" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ color: '#000' }} />
                <Bar
                  dataKey={dataType === 'ungrouped' ? 'frequency' : 'f'}
                  fill="url(#barGradientPDF)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={0}
                />
              </BarChart>
            </div>

            <div ref={chartRefs.polygon} style={{ width: 800, height: 450, background: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif', padding: 20, display: 'block' }}>
              <h2 style={{ color: '#2E7D32', textAlign: 'center', marginBottom: 10 }}>Frequency Polygon</h2>
              <LineChart width={760} height={400} data={results.freqTable}>
                <defs>
                  <linearGradient id="lineGradientPDF" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4CAF50" />
                    <stop offset="100%" stopColor="#8BC34A" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey={dataType === 'ungrouped' ? 'midpoint' : 'x'}
                  stroke="#4b5563"
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <YAxis stroke="#4b5563" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ color: '#000' }} />
                <Line
                  type="monotone"
                  dataKey={dataType === 'ungrouped' ? 'frequency' : 'f'}
                  stroke="url(#lineGradientPDF)"
                  strokeWidth={4}
                  dot={{ fill: '#4CAF50', strokeWidth: 3, r: 6 }}
                  activeDot={{ r: 8, fill: '#2E7D32' }}
                  animationDuration={0}
                />
              </LineChart>
            </div>

            <div ref={chartRefs.pie} style={{ width: 800, height: 500, background: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif', padding: 20, display: 'block' }}>
              <h2 style={{ color: '#2E7D32', textAlign: 'center', marginBottom: 10 }}>Distribution Pie Chart</h2>
              <PieChart width={760} height={450}>
                <defs>
                  {COLORS.map((color, i) => (
                    <linearGradient key={i} id={`pieGradientPDF${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={results.freqTable.map((row: any) => ({
                    name: row.class,
                    value: dataType === 'ungrouped' ? row.frequency : row.f
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine
                  outerRadius={120}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(1) : '0'}%`}
                  animationDuration={0}
                >
                  {results.freqTable.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={`url(#pieGradientPDF${index % COLORS.length})`} />
                  ))}
                </Pie>
              </PieChart>
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
      `}</style>
    </main>
  )
}