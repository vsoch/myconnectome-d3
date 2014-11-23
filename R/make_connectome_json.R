# make_connectome_json.R
# Make myconnectome input data json for d3 visualization!

# INPUT
# meta: a tab separated file of meta data
#	- "order" should specifiy the ordering of the nodes in the circle
#	- "label" should correspond to the label to be positioned around the circle
#	- "group" should correspond to the group name
#	- "image" should correspond to the image name to be shown for the node
#       - all other variables are ignored.  This can be changed if needed.
#
# correlation: a tab separated correlation matrix, with row and column labels equivalent to the "label" variable in the meta "label" field.  This matrix will
# be converted to Z scores to get the top / bottom of 95th percentile of connections
#
# threshold:  A threshold value for the connectivity matrix to determine neighbors, eg, a value of .95 means we only keep top 5% of positive and negative connections
#
# vsochat[at]stanford.edu
# for PoldrackLab MyConnectome

make_connectome_json = function(meta,data,thresh,output_file) {

# output file
meta = read.csv(meta,sep="\t",head=FALSE,stringsAsFactors=FALSE)
data = read.table(data,sep=" ")
colnames(meta) = c("order","old_order","x","y","z","hemisphere","network","network_id")

# The column names just need to be numbers from 1..N, again, this should correspond to
# row names
colnames(data) = gsub("V","",colnames(data))

# Calculate thresholded matrix
# First calculate threshold value
thresholded = data

# The correct image numbers should correspond to the old order number
image = paste("roi",formatC(meta$old_order, width=3, flag="0"),".png",sep="")
meta$image = image

# We are going to keep top .95 of positive and negative correlations for each row (this is what was done in original d3)
cat("Calculating node thresholds for values <> +/-",thresh,"\n")

# NEW ALGORITHM
# If the user specifies "99%" as threshold this means we will only include top 1% of negative and positive values

# Let's split into positive and negative
# I'm going to just do abs(neg) to get threshold, then negate it
pos = as.matrix(data)
neg = as.matrix(data)
pos[data < 0] = 0
neg[data > 0] = 0

# Try getting quantiles for top and bottom
qpos = quantile(pos,thresh)
qneg = quantile(abs(neg),thresh)

# From Russ: If there are very few nonzero connections (such as for afterscan.Anxiety) if the threshold is relatively loose (like 5%), which implies somethign like 10K connections, then there will be many fewer actual connections in the adjacency matrix than it would take to achieve that density. In that case I think the quantille function will just return zero, so that you can just threshold by the value returned by quantile and you should be fine. let me know if that makes sense.

pos[pos < qpos] = 0
neg[neg > (-1*qneg)] = 0

thresholded = pos + neg

# Take look at hist(thresholded) to confirm we still have pos and neg!

# OLD ALGORITHM
#for (d in 1:nrow(data)){
#  cat("Processing row",d,"\n")
#  row = data[d,]
#  node_threshold = max(abs(row)) * thresh
#  thresholded[d,which(abs(row) < node_threshold)] = 0
#}

# If you need to reshuffle your nodes based on some other order variable,
# here is how to do it:
# ordering_index = sort(meta$order,index.return=TRUE)
# ordering_index = ordering_index$ix
ordering_index = meta$order

# The meta$label variable should correspond with the order of the nodes in
# the original matrix.  In the case that the ordering around the circle (order)
# and the order in the matrix are the same, this can just be specified as follows:
meta$label = meta$order

# the group label should indicate the hemisphere AND network name - NOT just the network,
# otherwise left and right will be clumped together, and we want them separate (lateral)
groups = paste(meta$hemisphere,meta$network_id,sep="-")

# Finally... the colors!
color_labels = c("Default","Second-Dorsal-Attention","Ventral-Attention-Language","Second-Visual","Frontal-Parietal","Somatomotor","none","Parietal-Episodic-Retrieval","Parieto-Occipital","Cingulo-opercular","Salience","Frontal-Parietal-Other","First-Dorsal-Attention","First-Visual-V1+","Subcortical")
colors = c("#ff2700","#d6add6","#007d7d","#393FAC","#FFFB00","#00ffff","94CD54","#CC0066","#003eff","#fbfbda","#822082","#000000","#c46b8b","#00f700","#94cd54","#CC0066")

# Prepare a vector of colors base on the network name.
names(colors) = color_labels

# Add colors to network
color_vector = c()
for (m in 1:nrow(data)){
  color_vector = c(color_vector,colors[as.character(meta$network[m])])    
}


# For each, we will output a json object with our variables of interest
cat(file=output_file,"[\n")
for (dd in 1:length(ordering_index)){
  d = ordering_index[dd]
  cat("Processing row",dd,"of",nrow(thresholded),"\n")
  # First let's find its connections
  connection_idx = which(thresholded[d,]!=0)
  # Here are the labels of the connections
  connection_names = colnames(thresholded)[connection_idx]
  connection_groups = groups[connection_idx]
  connection_labels = paste(connection_groups, connection_names,sep=".")
  # Here are the strengths of the connections
  connection_values = round(as.numeric(thresholded[d,connection_idx]),3)
  connection_value_string = paste(connection_values,collapse="|")
  if (dd!=length(ordering_index)){
    cat(file=output_file,'{"name":"',groups[d],'.',meta$label[d],'","strength":"',connection_value_string,'","x":',meta$x[d],',"y":',meta$y[d],',"z":',meta$z[d],',"image":"',meta$image[d],'","order":',meta$order[d],',"color":"',color_vector[d],'","network":"',paste(meta$hemisphere[d],meta$network[d]),'","connections":["',paste(connection_labels,collapse='","'),'"]},\n',sep="",append=TRUE)
  }
  else {
    cat(file=output_file,'{"name":"',groups[d],'.',meta$label[d],'","strength":"',connection_value_string,'","x":',meta$x[d],',"y":',meta$y[d],',"z":',meta$z[d],',"image":"',meta$image[d],'","order":',meta$order[d],',"color":"',color_vector[d],'","network":"',paste(meta$hemisphered[d],meta$network[d]),'","connections":["',paste(connection_labels,collapse='","'),'"]}]',sep="",append=TRUE)
  }
}
}
