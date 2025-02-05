# This script will make the poral data input portal_data.tsv based on data files in web/data
# The data files are grouped based on the first name (the first word before the period)
# and sized based on mean connectivity (the radius)
#
# vsochat [at] Stanford
# Poldracklab

library(jsonlite)

args = commandArgs(TRUE)
input_folder = args[1]
output_folder = args[2]

setwd(output_foider)
data_files = list.files(input_folder,pattern="*.json")
tsv = c()

tsv = c()
for (file in data_files) {
  data = fromJSON(file, flatten = TRUE)
  strength = data$strength[-which(data$strength=="")]
  strength_num = c()
  for (s in strength) {
    strength_num = c(strength_num,as.numeric(strsplit(s,"[|]")[[1]]))
  strength = mean(strength_num)
  vector = c(gsub(".json","",file),strsplit(file,"[.]")[[1]][1],strsplit(file,"[.]")[[1]][2],strength)
  }
  tsv = rbind(tsv,vector)
}

tsv = as.data.frame (tsv,stringsAsFactors=FALSE)
colnames(tsv) = c("url","group_name","label","mean_connectivity")
# Scale between 0 and 100, round to int
node_radius = round(100*(as.numeric(tsv$mean_connectivity) - min(as.numeric(tsv$mean_connectivity) / (max(as.numeric(tsv$mean_connectivity)-min(as.numeric(tsv$mean_connectivity)))))),0)
tsv$radius = node_radius
# Determine color based on group
cluster =  as.numeric(as.factor(tsv$group_name))
tsv$cluster = cluster
write.table(tsv,paste(output_folder,"/portal_data.tsv",sep=""),row.names=FALSE,col.names=TRUE,sep="\t",quote=FALSE)


