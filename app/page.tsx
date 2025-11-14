'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { calculateUngrouped, calculateGrouped, buildFrequencyTable, calculateKAuto } from '@/lib/calculations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

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

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981']

  const isValidFreqTable = results?.freqTable && 
    (dataType === 'ungrouped' ? results.freqTable[0]?.midpoint !== undefined : results.freqTable[0]?.x !== undefined)

  const renderEquation = (label: string, equation: string, value: string) => (
    <div className="group mb-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition-all duration-300">
      <p className="font-bold text-base text-gray-800 mb-1">{label}</p>
      <p className="text-sm text-gray-600 font-mono mb-2 bg-white/70 p-2 rounded">{equation}</p>
      <p className="font-mono text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{value}</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block mb-4 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full">
            <span className="text-white font-semibold text-sm tracking-wide">ADVANCED ANALYTICS</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 drop-shadow-lg">
            Statistics Calculator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Professional-grade data analysis with beautiful visualizations
          </p>
        </div>
        
        {/* Main Input Card */}
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
          <Tabs value={dataType} onValueChange={handleTabChange} className="w-full relative">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 p-2 rounded-t-xl">
              <TabsTrigger 
                value="ungrouped" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 font-semibold transition-all duration-300 rounded-lg"
              >
                📊 Ungrouped Data
              </TabsTrigger>
              <TabsTrigger 
                value="grouped" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 font-semibold transition-all duration-300 rounded-lg"
              >
                📈 Grouped Data
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ungrouped" className="mt-0 p-8 space-y-6">
              <Card className="shadow-xl border border-indigo-500/20 bg-gray-800/50 backdrop-blur">
                <CardHeader className="pb-4 border-b border-indigo-500/20">
                  <CardTitle className="text-3xl font-bold text-white">Ungrouped Data Input</CardTitle>
                  <CardDescription className="text-gray-400 text-base">Enter individual values and build your dataset</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label htmlFor="rawInput" className="text-sm font-semibold text-gray-300 mb-2 block">Enter Number</Label>
                      <Input 
                        id="rawInput"
                        value={rawInput} 
                        onChange={(e) => setRawInput(e.target.value)} 
                        placeholder="e.g., 175"
                        onKeyDown={(e) => e.key === 'Enter' && addToRawList()}
                        className="bg-gray-700/50 border-indigo-500/30 text-white placeholder-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50 h-12 text-lg"
                      />
                    </div>
                    <Button 
                      onClick={addToRawList} 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg h-12 px-8"
                    >
                      {editingIndex >= 0 ? '✓ Update' : '+ Add'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={addRandomUngrouped} 
                      className="border-indigo-500/50 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 h-12 px-6"
                    >
                      🎲 Random
                    </Button>
                  </div>
                  
                  <div className="min-h-[200px] max-h-64 overflow-y-auto border border-indigo-500/30 rounded-xl p-4 bg-gray-900/50 backdrop-blur">
                    {rawList.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {rawList.map((num, index) => (
                          <div key={index} className="group relative flex items-center justify-between p-3 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-lg border border-indigo-500/30 hover:border-indigo-400 transition-all duration-300 hover:scale-105">
                            <Badge 
                              className="cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg px-4 py-1 hover:from-indigo-600 hover:to-purple-600" 
                              onClick={() => editRawItem(index, num)}
                            >
                              {num}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeRawItem(index)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-center italic text-lg">Dataset is empty. Add numbers to begin.</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="k" className="text-sm font-semibold text-gray-300 mb-2 block">Number of Classes (K) - Optional</Label>
                    <Input 
                      id="k"
                      type="number" 
                      value={kValue} 
                      onChange={(e) => setKValue(e.target.value)} 
                      placeholder="Auto-calculated if left blank"
                      className="bg-gray-700/50 border-indigo-500/30 text-white placeholder-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleCalculate} 
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-lg shadow-2xl h-14 rounded-xl"
                  >
                    🚀 Calculate Statistics
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grouped" className="mt-0 p-8 space-y-6">
              <Card className="shadow-xl border border-purple-500/20 bg-gray-800/50 backdrop-blur">
                <CardHeader className="pb-4 border-b border-purple-500/20">
                  <CardTitle className="text-3xl font-bold text-white">Grouped Data Input</CardTitle>
                  <CardDescription className="text-gray-400 text-base">Define class intervals with frequencies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-300 mb-2 block">Class Start</Label>
                      <Input 
                        value={groupLower} 
                        onChange={(e) => setGroupLower(e.target.value)} 
                        placeholder="29" 
                        type="number"
                        className="bg-gray-700/50 border-purple-500/30 text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 h-12 text-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-300 mb-2 block">Class End</Label>
                      <Input 
                        value={groupUpper} 
                        onChange={(e) => setGroupUpper(e.target.value)} 
                        placeholder="39" 
                        type="number"
                        className="bg-gray-700/50 border-purple-500/30 text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 h-12 text-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-300 mb-2 block">Frequency</Label>
                      <Input 
                        value={groupFreq} 
                        onChange={(e) => setGroupFreq(e.target.value)} 
                        placeholder="5" 
                        type="number"
                        className="bg-gray-700/50 border-purple-500/30 text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 h-12 text-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={addGroupRow} 
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg h-12 px-8"
                    >
                      ✓ Add Row
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={addRandomGrouped} 
                      className="border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 h-12 px-6"
                    >
                      🎲 Random
                    </Button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-purple-500/30 bg-gray-900/50">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-800">
                        <TableRow className="border-purple-500/30">
                          <TableHead className="text-gray-300 font-bold">Class Interval</TableHead>
                          <TableHead className="text-gray-300 font-bold">Frequency</TableHead>
                          <TableHead className="text-gray-300 font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedRows.map((row, index) => (
                          <TableRow key={index} className="border-purple-500/20 hover:bg-purple-500/10 transition-colors">
                            <TableCell className="font-mono text-indigo-300 font-semibold">{row.lower} - {row.upper}</TableCell>
                            <TableCell className="text-white font-semibold">{row.freq}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeGroupRow(index)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
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
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white font-bold text-lg shadow-2xl h-14 rounded-xl"
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
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-orange-500/10"></div>
              <Tabs defaultValue="tables" className="w-full relative">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 p-2 rounded-t-xl">
                  <TabsTrigger 
                    value="tables" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-rose-600 data-[state=active]:text-white text-gray-400 font-semibold transition-all duration-300 rounded-lg"
                  >
                    📋 Tables
                  </TabsTrigger>
                  <TabsTrigger 
                    value="summary" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-rose-600 data-[state=active]:text-white text-gray-400 font-semibold transition-all duration-300 rounded-lg"
                  >
                    📊 Summary
                  </TabsTrigger>
                  <TabsTrigger 
                    value="charts" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-rose-600 data-[state=active]:text-white text-gray-400 font-semibold transition-all duration-300 rounded-lg"
                  >
                    📈 Charts
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="tables" className="mt-0 p-8">
                  {dataType === 'ungrouped' && results?.freqTable && (
                    <Card className="shadow-xl border border-pink-500/20 bg-gray-800/50 backdrop-blur">
                      <CardHeader className="border-b border-pink-500/20">
                        <CardTitle className="text-2xl font-bold text-white">📊 Frequency Distribution Table</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="overflow-x-auto rounded-xl border border-pink-500/30">
                          <Table>
                            <TableHeader className="bg-gray-900">
                              <TableRow className="border-pink-500/30">
                                <TableHead className="text-gray-300 font-bold">Classes</TableHead>
                                <TableHead className="text-gray-300 font-bold">f</TableHead>
                                <TableHead className="text-gray-300 font-bold">R.F (%)</TableHead>
                                <TableHead className="text-gray-300 font-bold">X</TableHead>
                                <TableHead className="text-gray-300 font-bold">Cum. Asc.</TableHead>
                                <TableHead className="text-gray-300 font-bold">Cum. Desc.</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {results.freqTable.map((row: any, i: number) => (
                                <TableRow key={i} className="border-pink-500/20 hover:bg-pink-500/10 transition-colors">
                                  <TableCell className="font-mono text-indigo-300">{row.class}</TableCell>
                                  <TableCell className="text-white font-semibold">{row.frequency}</TableCell>
                                  <TableCell className="text-right text-pink-300">{((row.frequency / results.freqTable.reduce((sum: number, r: any) => sum + r.frequency, 0)) * 100).toFixed(1)}%</TableCell>
                                  <TableCell className="text-right text-white">{row.midpoint}</TableCell>
                                  <TableCell className="text-right text-green-300">{row.cumulativeAsc}</TableCell>
                                  <TableCell className="text-right text-orange-300">{row.cumulativeDesc}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-gradient-to-r from-pink-600/20 to-rose-600/20 font-bold border-t-2 border-pink-500">
                                <TableCell className="text-white">Total</TableCell>
                                <TableCell className="text-white">{results.freqTable.reduce((sum: number, r: any) => sum + r.frequency, 0)}</TableCell>
                                <TableCell className="text-white">100%</TableCell>
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
                    <Card className="shadow-xl border border-purple-500/20 bg-gray-800/50 backdrop-blur">
                      <CardHeader className="border-b border-purple-500/20">
                        <CardTitle className="text-2xl font-bold text-white">📊 Complete Frequency Table</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="overflow-x-auto rounded-xl border border-purple-500/30">
                          <Table>
                            <TableHeader className="bg-gray-900">
                              <TableRow className="border-purple-500/30">
                                <TableHead className="text-gray-300 font-bold">Classes</TableHead>
                                <TableHead className="text-gray-300 font-bold">Actual Bounds</TableHead>
                                <TableHead className="text-gray-300 font-bold">x</TableHead>
                                <TableHead className="text-gray-300 font-bold">f</TableHead>
                                <TableHead className="text-gray-300 font-bold">R.F (%)</TableHead>
                                <TableHead className="text-gray-300 font-bold">Cum. Asc.</TableHead>
                                <TableHead className="text-gray-300 font-bold">Cum. Desc.</TableHead>
                                <TableHead className="text-gray-300 font-bold">fx</TableHead>
                                <TableHead className="text-gray-300 font-bold">(x - mean)</TableHead>
                                <TableHead className="text-gray-300 font-bold">f(x - mean)²</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {results.freqTable.map((row: any, i: number) => (
                                <TableRow key={i} className="border-purple-500/20 hover:bg-purple-500/10 transition-colors">
                                  <TableCell className="font-mono text-indigo-300">{row.class}</TableCell>
                                  <TableCell className="font-mono text-purple-300">{row.actualBounds}</TableCell>
                                  <TableCell className="text-right text-white">{row.x?.toFixed(1) || 'N/A'}</TableCell>
                                  <TableCell className="text-right text-white font-semibold">{row.f}</TableCell>
                                  <TableCell className="text-right text-pink-300">{row.rf?.toFixed(1) || 'N/A'}%</TableCell>
                                  <TableCell className="text-right text-green-300">{row.cumulativeAsc}</TableCell>
                                  <TableCell className="text-right text-orange-300">{row.cumulativeDesc}</TableCell>
                                  <TableCell className="text-right text-yellow-300">{row.fx?.toFixed(1) || 'N/A'}</TableCell>
                                  <TableCell className="text-right text-blue-300">{row.deviation?.toFixed(1) || 'N/A'}</TableCell>
                                  <TableCell className="text-right text-rose-300">{row.fDevSquared?.toFixed(1) || 'N/A'}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 font-bold border-t-2 border-purple-500">
                                <TableCell className="text-white">Total</TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-white">{results.freqTable.reduce((sum: number, r: any) => sum + r.f, 0)}</TableCell>
                                <TableCell className="text-white">100%</TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-white">{(results.groupedStats.mean * results.freqTable.reduce((sum: number, r: any) => sum + r.f, 0)).toFixed(1)}</TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-white">{(results.groupedStats.variance * (results.freqTable.reduce((sum: number, r: any) => sum + r.f, 0) - 1)).toFixed(1)}</TableCell>
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
                      <Card className="shadow-xl border border-indigo-500/20 bg-gray-800/50 backdrop-blur">
                        <CardHeader className="border-b border-indigo-500/20">
                          <CardTitle className="text-2xl font-bold text-white">📊 Raw Data Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { label: 'Mean', value: results.rawStats.mean?.toFixed(2), color: 'from-blue-500 to-cyan-500' },
                              { label: 'Median', value: results.rawStats.median?.toFixed(2), color: 'from-purple-500 to-pink-500' },
                              { label: 'Mode', value: Array.isArray(results.rawStats.mode) ? results.rawStats.mode.join(', ') : results.rawStats.mode, color: 'from-green-500 to-emerald-500' },
                              { label: 'Range', value: results.rawStats.range?.toFixed(2), color: 'from-orange-500 to-red-500' },
                              { label: 'Std Dev', value: results.rawStats.stdDev?.toFixed(2), color: 'from-pink-500 to-rose-500' },
                              { label: 'Variance', value: results.rawStats.variance?.toFixed(2), color: 'from-indigo-500 to-purple-500' },
                              { label: 'C.V.', value: `${results.rawStats.cv?.toFixed(2)}%`, color: 'from-yellow-500 to-amber-500' },
                              { label: 'Geometric Mean', value: results.rawStats.geometricMean?.toFixed(2), color: 'from-teal-500 to-cyan-500' }
                            ].map((stat, idx) => (
                              <div key={idx} className={`p-5 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 border border-white/10 hover:scale-105 transition-transform duration-300`}>
                                <p className="text-gray-400 text-sm font-semibold mb-1">{stat.label}</p>
                                <p className="text-white text-3xl font-bold">{stat.value}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="shadow-xl border border-purple-500/20 bg-gray-800/50 backdrop-blur">
                        <CardHeader className="border-b border-purple-500/20">
                          <CardTitle className="text-2xl font-bold text-white">📐 Grouped Data Analysis</CardTitle>
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
                              <div key={idx} className="p-4 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:scale-105 transition-transform duration-300">
                                <p className="text-gray-300 text-sm font-semibold mb-1">{stat.icon} {stat.label}</p>
                                <p className="text-white text-2xl font-bold">{stat.value}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                  {dataType === 'grouped' && results && (
                    <Card className="shadow-xl border border-purple-500/20 bg-gray-800/50 backdrop-blur">
                      <CardHeader className="border-b border-purple-500/20">
                        <CardTitle className="text-2xl font-bold text-white">📊 Grouped Data Summary</CardTitle>
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
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                          {[
                            { label: 'Mean', value: results.groupedStats.mean?.toFixed(2), color: 'from-blue-600 to-cyan-600' },
                            { label: 'Median', value: results.groupedStats.median?.toFixed(2), color: 'from-purple-600 to-pink-600' },
                            { label: 'Mode', value: results.groupedStats.mode?.toFixed(2), color: 'from-green-600 to-emerald-600' },
                            { label: 'Range', value: results.groupedStats.range?.toFixed(2), color: 'from-orange-600 to-red-600' },
                            { label: 'Geometric Mean', value: results.groupedStats.geometricMean?.toFixed(2), color: 'from-teal-600 to-cyan-600' },
                            { label: 'Harmonic Mean', value: results.groupedStats.harmonicMean?.toFixed(2), color: 'from-yellow-600 to-amber-600' }
                          ].map((stat, idx) => (
                            <div key={idx} className={`p-5 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 border border-white/10 hover:scale-105 transition-transform duration-300`}>
                              <p className="text-gray-400 text-sm font-semibold mb-1">{stat.label}</p>
                              <p className="text-white text-2xl font-bold">{stat.value}</p>
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
                      <Card className="shadow-xl border border-indigo-500/20 bg-gray-800/50 backdrop-blur overflow-hidden">
                        <CardHeader className="border-b border-indigo-500/20 bg-gradient-to-r from-indigo-600/10 to-blue-600/10">
                          <CardTitle className="text-2xl font-bold text-white">📊 Histogram</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="h-[450px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={results.freqTable}>
                                <defs>
                                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="class" stroke="#9ca3af" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#1f2937', 
                                    border: '1px solid #4f46e5',
                                    borderRadius: '8px',
                                    color: '#fff'
                                  }} 
                                />
                                <Legend wrapperStyle={{ color: '#fff' }} />
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
                      
                      <Card className="shadow-xl border border-pink-500/20 bg-gray-800/50 backdrop-blur overflow-hidden">
                        <CardHeader className="border-b border-pink-500/20 bg-gradient-to-r from-pink-600/10 to-rose-600/10">
                          <CardTitle className="text-2xl font-bold text-white">📈 Frequency Polygon</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="h-[450px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={results.freqTable}>
                                <defs>
                                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#ec4899"/>
                                    <stop offset="100%" stopColor="#f43f5e"/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis 
                                  dataKey={dataType === 'ungrouped' ? 'midpoint' : 'x'} 
                                  stroke="#9ca3af" 
                                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#1f2937', 
                                    border: '1px solid #ec4899',
                                    borderRadius: '8px',
                                    color: '#fff'
                                  }} 
                                />
                                <Legend wrapperStyle={{ color: '#fff' }} />
                                <Line 
                                  type="monotone" 
                                  dataKey={dataType === 'ungrouped' ? 'frequency' : 'f'} 
                                  stroke="url(#lineGradient)" 
                                  strokeWidth={4} 
                                  dot={{ fill: '#ec4899', strokeWidth: 3, r: 6 }} 
                                  activeDot={{ r: 8, fill: '#f43f5e' }}
                                  animationDuration={1000}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="shadow-xl border border-purple-500/20 bg-gray-800/50 backdrop-blur overflow-hidden">
                        <CardHeader className="border-b border-purple-500/20 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
                          <CardTitle className="text-2xl font-bold text-white">🥧 Distribution Pie Chart</CardTitle>
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
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                  animationDuration={1000}
                                >
                                  {results.freqTable.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={`url(#pieGradient${index % COLORS.length})`} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#1f2937', 
                                    border: '1px solid #8b5cf6',
                                    borderRadius: '8px',
                                    color: '#fff'
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