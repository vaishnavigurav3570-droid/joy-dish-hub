const fs = require('fs');
const content = fs.readFileSync('src/components/OwnerSection.tsx', 'utf8').split('\n');
const replacement = `        <TabsContent value="orders">
          <OwnerOrders
            liveOrders={stats.liveOrders}
            orders={orders}
            markNoShow={markNoShow}
            markBillSent={markBillSent}
            setPreviewOrder={setPreviewOrder}
            handleDownloadBill={handleDownloadBill}
          />
        </TabsContent>

        <TabsContent value="menu">
          <OwnerMenuManager
            menu={menu}
            arFileRef={arFileRef}
            handleARUpload={handleARUpload}
            uploadingAR={uploadingAR}
            toggleMenuAvailability={toggleMenuAvailability}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <OwnerAnalytics
            orders={orders}
            menu={menu}
            stats={stats}
            handleExportPDF={handleExportPDF}
            exportingPDF={exportingPDF}
            setPreviewOrder={setPreviewOrder}
            handleDownloadBill={handleDownloadBill}
          />
        </TabsContent>

        <TabsContent value="customers">
          <OwnerCustomers orders={orders} stats={stats} />
        </TabsContent>

        <TabsContent value="archives">
          <OwnerArchives
            archiveMonth={archiveMonth}
            setArchiveMonth={setArchiveMonth}
            archiveMonthOptions={archiveMonthOptions}
            archiveLabel={archiveLabel}
            archiveOrders={archiveOrders}
            handleDownloadCSV={handleDownloadCSV}
            downloadingCSV={downloadingCSV}
            handleDownloadArchivePDF={handleDownloadArchivePDF}
            downloadingArchivePDF={downloadingArchivePDF}
            deleteConfirmStep={deleteConfirmStep}
            setDeleteConfirmStep={setDeleteConfirmStep}
            deletingMonth={deletingMonth}
            handleDeleteMonthData={handleDeleteMonthData}
          />
        </TabsContent>
      </Tabs>`;
content.splice(406, 894 - 407 + 1, replacement);
fs.writeFileSync('src/components/OwnerSection.tsx', content.join('\n'));
